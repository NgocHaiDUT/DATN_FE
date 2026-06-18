// File: BE/src/common/config/file-storage.config.ts
// Service để handle upload ảnh đến AWS S3 hoặc Local Storage

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

export interface FileUploadResult {
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class FileStorageService {
  private s3Client: S3Client | null = null;
  private useS3: boolean;
  private s3Bucket: string;
  private s3Url: string;
  private localUploadPath: string;

  constructor(private configService: ConfigService) {
    this.useS3 = this.configService.get('USE_AWS_S3') !== 'false';
    this.s3Bucket = this.configService.get('AWS_S3_BUCKET_NAME') || '';
    this.s3Url = this.configService.get('AWS_S3_URL') || '';
    this.localUploadPath = path.join(process.cwd(), 'uploads');

    // Initialize S3 if configured
    if (this.useS3 && this.s3Bucket) {
      this.s3Client = new S3Client({
        region: this.configService.get('AWS_REGION') || 'ap-southeast-1',
        credentials: {
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
        },
      });
    }
  }

  /**
   * Upload file ảnh
   * @param file - Express File object
   * @param folder - Folder trong S3 hoặc uploads (e.g., 'products', 'avatars')
   */
  async uploadFile(file: Express.Multer.File, folder: string): Promise<FileUploadResult> {
    if (!file) {
      throw new BadRequestException('File không được tìm thấy');
    }

    // Validate file
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type không được hỗ trợ: ${file.mimetype}`);
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new BadRequestException('File quá lớn (max 50MB)');
    }

    if (this.useS3 && this.s3Client) {
      return this.uploadToS3(file, folder);
    } else {
      return this.uploadToLocal(file, folder);
    }
  }

  /**
   * Upload lên AWS S3
   */
  private async uploadToS3(
    file: Express.Multer.File,
    folder: string,
  ): Promise<FileUploadResult> {
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname}`;
    const key = `${folder}/${fileName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      });

      await this.s3Client!.send(command);

      const url = `${this.s3Url}/${key}`;

      return {
        url,
        fileName,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new BadRequestException(`Lỗi upload S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload lên Local Storage
   */
  private async uploadToLocal(
    file: Express.Multer.File,
    folder: string,
  ): Promise<FileUploadResult> {
    const folderPath = path.join(this.localUploadPath, folder);

    // Create folder if not exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname}`;
    const filePath = path.join(folderPath, fileName);

    try {
      fs.writeFileSync(filePath, file.buffer);

      const url = `/uploads/${folder}/${fileName}`;

      return {
        url,
        fileName,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      console.error('Local Upload Error:', error);
      throw new BadRequestException(`Lỗi upload local: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    if (this.useS3 && this.s3Client) {
      // Extract key từ S3 URL
      // URL format: https://bucket.s3.region.amazonaws.com/key
      // hoặc custom: https://custom-domain.com/key
      const key = fileUrl.split('/').slice(-2).join('/');

      try {
        const command = new DeleteObjectCommand({
          Bucket: this.s3Bucket,
          Key: key,
        });
        await this.s3Client.send(command);
      } catch (error) {
        console.error('S3 Delete Error:', error);
      }
    } else {
      // Delete from local
      const filePath = path.join(process.cwd(), 'public', fileUrl);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error('Local Delete Error:', error);
      }
    }
  }

  /**
   * Get file URL (for database storage)
   */
  getFileUrl(fileUrl: string): string {
    if (!fileUrl) return '';

    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }

    if (this.useS3) {
      return `${this.s3Url}/${fileUrl}`;
    } else {
      return `/uploads/${fileUrl}`;
    }
  }
}
