import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @ApiOperation({ summary: 'API sağlık durumu' })
  @ApiResponse({ status: 200, description: 'API ve database çalışıyor' })
  @ApiResponse({ status: 500, description: 'API veya database çalışmıyor' })
  async checkHealth() {
    const dbStatus = this.connection.readyState === 1 ? 'connected' : 'disconnected';

    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      message: 'Media Library API is running successfully',
    };
  }
}
