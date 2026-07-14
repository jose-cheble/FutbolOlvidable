import {
  Injectable,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly uploadPath: string;
  private readonly maxSizeMb: number;
  private readonly quality: number;
  private readonly maxWidth: number;
  private readonly maxHeight: number;

  constructor(private readonly config: ConfigService) {
    this.uploadPath = this.config.get<string>('UPLOAD_PATH', './uploads');
    this.maxSizeMb = Number(this.config.get('UPLOAD_MAX_SIZE_MB', 5));
    this.quality = Number(this.config.get('UPLOAD_WEBP_QUALITY', 80));
    this.maxWidth = Number(this.config.get('UPLOAD_MAX_WIDTH', 800));
    this.maxHeight = Number(this.config.get('UPLOAD_MAX_HEIGHT', 800));
  }

  async onModuleInit() {
    await fs.mkdir(path.join(this.uploadPath, 'groups'), { recursive: true });
    await fs.mkdir(path.join(this.uploadPath, 'players'), { recursive: true });
    await fs.mkdir(path.join(this.uploadPath, 'users'), { recursive: true });
  }

  async saveImage(
    file: Express.Multer.File,
    folder: 'groups' | 'players' | 'users',
  ): Promise<string> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo requerido');
    }

    const filename = `${randomUUID()}.webp`;
    const destDir = path.join(this.uploadPath, folder);
    await fs.mkdir(destDir, { recursive: true });
    const destPath = path.join(destDir, filename);

    await sharp(file.buffer)
      .rotate()
      .resize(this.maxWidth, this.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: this.quality })
      .toFile(destPath);

    return `/uploads/${folder}/${filename}`;
  }
}
