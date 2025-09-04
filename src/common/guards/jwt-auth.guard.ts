import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ModuleRef } from '@nestjs/core';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private authService: AuthService;

  constructor(private moduleRef: ModuleRef) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Lazy resolve (çünkü Passport dynamic class injection sıkıntılı)
    if (!this.authService) {
      this.authService = this.moduleRef.get(AuthService, { strict: false });
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) throw new UnauthorizedException('Token bulunamadı');

    if (await this.authService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token geçersiz kılınmış');
    }

    return (await super.canActivate(context)) as boolean;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Geçersiz token');
    }
    return user;
  }
}
