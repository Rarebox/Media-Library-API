import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { Media, MediaSchema } from './schemas/media.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Media.name, schema: MediaSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
