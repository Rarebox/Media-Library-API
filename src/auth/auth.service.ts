// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  BlacklistedToken,
  BlacklistedTokenDocument,
} from './schemas/blacklisted-token.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(BlacklistedToken.name)
    private blModel: Model<BlacklistedTokenDocument>,
    private jwtService: JwtService
  ) {}

  // Kullanıcı kaydı
  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.userModel.create({
      email,
      passwordHash,
    });

    return this.generateTokens(user);
  }

  // Login
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException('Geçersiz email veya şifre');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Geçersiz email veya şifre');

    return this.generateTokens(user);
  }

  // Token üretme
  private generateTokens(user: UserDocument) {
    const payload = { sub: user._id.toString(), email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  // Refresh rotation
  async refreshTokens(refreshToken: string) {
    // Refresh token blacklist kontrolü
    if (await this.isTokenBlacklisted(refreshToken)) {
      throw new UnauthorizedException('Refresh token geçersiz');
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user) throw new UnauthorizedException('Kullanıcı bulunamadı');

      // Eski refresh’i blacklist et
      const decoded: any = this.jwtService.decode(refreshToken);
      if (decoded?.exp) {
        await this.blModel.updateOne(
          { token: refreshToken },
          { $set: { token: refreshToken, expiresAt: new Date(decoded.exp * 1000) } },
          { upsert: true }
        );
      }

      // Yeni token çifti
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Geçersiz refresh token');
    }
  }

  // Logout → access token’ı blacklist et
  async logout(token: string): Promise<void> {
    console.log('Logout token:', token);

    const decoded = this.jwtService.decode(token);
    console.log('Decoded token:', decoded);

    if (!decoded || typeof decoded !== 'object') {
      throw new UnauthorizedException('Token çözümlenemedi');
    }

    const exp = (decoded as any).exp;
    if (!exp) {
      throw new UnauthorizedException('Token exp alanı yok');
    }

    const expiresAt = new Date(exp * 1000);

    await this.blModel.updateOne(
      { token },
      { $set: { token, expiresAt } },
      { upsert: true }
    );

    console.log('Token blacklisted:', token, 'Expires at:', expiresAt);
  }

  // Blacklist kontrolü
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const exists = await this.blModel.exists({ token });
    return !!exists;
  }
}
