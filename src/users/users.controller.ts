import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Mevcut kullanıcı bilgilerini getir' })
  @ApiResponse({ status: 200, description: 'Kullanıcı bilgileri' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  async getMe(@Req() req: any) {
    return this.usersService.findById(req.user.sub);
  }
}
