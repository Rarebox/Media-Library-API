// src/auth/schemas/blacklisted-token.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class BlacklistedToken {
  @Prop({ required: true, index: true, unique: true })
  token: string;

  @Prop({ required: true, index: true, expires: 0 }) // TTL index
  expiresAt: Date;
}

export type BlacklistedTokenDocument = BlacklistedToken & Document;
export const BlacklistedTokenSchema = SchemaFactory.createForClass(BlacklistedToken);
