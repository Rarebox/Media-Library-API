import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password } = registerDto;

    // Şifreyi hash'le
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Kullanıcı oluştur
    const user = await this.userModel.create({
      email,
      passwordHash,
    });

    // Token'ları oluştur
    const tokens = await this.generateTokens(user);
    return tokens;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Kullanıcıyı bul
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Geçersiz email veya şifre');
    }

    // Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Geçersiz email veya şifre');
    }

    // Token'ları oluştur
    const tokens = await this.generateTokens(user);
    return tokens;
  }

  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

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

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Kullanıcı bulunamadı');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Geçersiz refresh token');
    }
  }
}
