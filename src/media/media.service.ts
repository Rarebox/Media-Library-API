import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createReadStream, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Media, MediaDocument } from './schemas/media.schema';
import { User } from '../users/schemas/user.schema';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Media.name) private mediaModel: Model<MediaDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  // Medya yükleme
  async create(file: Express.Multer.File, userId: string): Promise<Media> {
    const media = await this.mediaModel.create({
      ownerId: new Types.ObjectId(userId),
      fileName: file.originalname,
      filePath: file.path,
      mimeType: file.mimetype,
      size: file.size,
    });

    return media;
  }

  // Kullanıcının medyalarını listeleme
  async findAllByUser(userId: string): Promise<Media[]> {
    return this.mediaModel.find({ ownerId: userId }).exec();
  }

  // Medya detaylarını getirme
  async findOne(id: string, userId: string): Promise<Media> {
    const media = await this.mediaModel.findById(id);
    if (!media) {
      throw new NotFoundException('Medya bulunamadı');
    }

    // Erişim kontrolü
    await this.checkAccess(media, userId);

    return media;
  }

  // Medya indirme
  async download(id: string, userId: string): Promise<{ stream: any; media: Media }> {
    const media = await this.mediaModel.findById(id);
    if (!media) {
      throw new NotFoundException('Medya bulunamadı');
    }

    // Erişim kontrolü
    await this.checkAccess(media, userId);

    // Dosya var mı kontrol et
    if (!existsSync(media.filePath)) {
      throw new NotFoundException('Dosya bulunamadı');
    }

    // Dosya stream'i oluştur
    const stream = createReadStream(media.filePath);
    return { stream, media };
  }

  // Medya silme
  async remove(id: string, userId: string): Promise<void> {
    const media = await this.mediaModel.findById(id);
    if (!media) {
      throw new NotFoundException('Medya bulunamadı');
    }

    // Sadece sahip silebilir
    if (media.ownerId.toString() !== userId) {
      throw new ForbiddenException('Bu medyayı silme yetkiniz yok');
    }

    // Dosyayı fiziksel olarak sil
    if (existsSync(media.filePath)) {
      unlinkSync(media.filePath);
    }

    await this.mediaModel.findByIdAndDelete(id);
  }

  // İzinleri güncelleme
  async updatePermissions(id: string, updatePermissionsDto: UpdatePermissionsDto, userId: string): Promise<Media> {
    const media = await this.mediaModel.findById(id);
    if (!media) {
      throw new NotFoundException('Medya bulunamadı');
    }

    // Sadece sahip izin verebilir
    if (media.ownerId.toString() !== userId) {
      throw new ForbiddenException('Bu medya için izin verme yetkiniz yok');
    }

    const { userId: targetUserId, action } = updatePermissionsDto;

    // Kullanıcı var mı kontrol et
    const userExists = await this.userModel.findById(targetUserId);
    if (!userExists) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (action === 'add') {
      // İzin ekle (zaten varsa ekleme)
      if (!media.allowedUserIds.includes(new Types.ObjectId(targetUserId))) {
        media.allowedUserIds.push(new Types.ObjectId(targetUserId));
      }
    } else if (action === 'remove') {
      // İzin kaldır
      media.allowedUserIds = media.allowedUserIds.filter(
        id => id.toString() !== targetUserId,
      );
    }

    return media.save();
  }

  // İzinleri listeleme
  async getPermissions(id: string, userId: string): Promise<Types.ObjectId[]> {
    const media = await this.mediaModel.findById(id);
    if (!media) {
      throw new NotFoundException('Medya bulunamadı');
    }

    // Sadece sahip izinleri görebilir
    if (media.ownerId.toString() !== userId) {
      throw new ForbiddenException('Bu medyanın izinlerini görme yetkiniz yok');
    }

    return media.allowedUserIds;
  }

  // Erişim kontrolü
  private async checkAccess(media: Media, userId: string): Promise<void> {
    const isOwner = media.ownerId.toString() === userId;
    const hasPermission = media.allowedUserIds.some(
      id => id.toString() === userId,
    );

    if (!isOwner && !hasPermission) {
      throw new ForbiddenException('Bu medyaya erişim izniniz yok');
    }
  }
}
