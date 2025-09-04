import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type MediaDocument = Media & Document;

@Schema({ timestamps: true })
export class Media {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  filePath: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  allowedUserIds: Types.ObjectId[];
}

export const MediaSchema = SchemaFactory.createForClass(Media);
