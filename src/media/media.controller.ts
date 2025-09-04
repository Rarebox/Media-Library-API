import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Res,
  Body,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Medya yükleme' })
  @ApiResponse({ status: 201, description: 'Medya başarıyla yüklendi' })
  @ApiResponse({ status: 400, description: 'Geçersiz dosya formatı' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Yüklenecek dosya',
    type: CreateMediaDto,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: process.env.UPLOAD_DIR || './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Sadece JPEG dosyaları yüklenebilir'), false);
        }
      },
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
      },
    })
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request
  ) {
    const userId = (req.user as any).sub;
    return this.mediaService.create(file, userId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Kullanıcının medyalarını listeleme' })
  @ApiResponse({ status: 200, description: 'Medya listesi' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  async findAll(@Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.mediaService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Medya detaylarını getirme' })
  @ApiResponse({ status: 200, description: 'Medya detayları' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 403, description: 'Erişim engellendi' })
  @ApiResponse({ status: 404, description: 'Medya bulunamadı' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.mediaService.findOne(id, userId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Medya indirme' })
  @ApiResponse({ status: 200, description: 'Medya dosyası' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 403, description: 'Erişim engellendi' })
  @ApiResponse({ status: 404, description: 'Medya bulunamadı' })
  async download(
    @Param('id') id: string,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const userId = (req.user as any).sub;
    const { stream, media } = await this.mediaService.download(id, userId);

    res.set({
      'Content-Type': media.mimeType,
      'Content-Disposition': `attachment; filename="${media.fileName}"`,
      'Content-Length': media.size,
    });

    stream.pipe(res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Medya silme' })
  @ApiResponse({ status: 200, description: 'Medya silindi' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 403, description: 'Erişim engellendi' })
  @ApiResponse({ status: 404, description: 'Medya bulunamadı' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.mediaService.remove(id, userId);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'Medya izinlerini listeleme' })
  @ApiResponse({ status: 200, description: 'İzin listesi' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 403, description: 'Erişim engellendi' })
  @ApiResponse({ status: 404, description: 'Medya bulunamadı' })
  async getPermissions(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).sub;
    return this.mediaService.getPermissions(id, userId);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Medya izinlerini güncelleme' })
  @ApiResponse({ status: 200, description: 'İzinler güncellendi' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 403, description: 'Erişim engellendi' })
  @ApiResponse({ status: 404, description: 'Medya veya kullanıcı bulunamadı' })
  async updatePermissions(
    @Param('id') id: string,
    @Body() updatePermissionsDto: UpdatePermissionsDto,
    @Req() req: Request
  ) {
    const userId = (req.user as any).sub;
    return this.mediaService.updatePermissions(id, updatePermissionsDto, userId);
  }
}
