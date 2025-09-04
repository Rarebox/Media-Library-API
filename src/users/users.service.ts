import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select('-passwordHash');
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument> {
    return this.userModel.findOne({ email });
  }
}
