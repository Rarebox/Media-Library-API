import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { MediaModule } from '../src/media/media.module';
import { HealthModule } from '../src/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');
        return { uri };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    MediaModule,
    HealthModule,
  ],
})
export class AppModule {}
