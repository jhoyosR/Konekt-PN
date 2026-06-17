import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import * as path from 'path';
import { StorageStrategy, FileUploadResult } from '../interfaces/storage-strategy.interface';
import { UuidAdapter } from '../../common/adapters/uuid.adapter';

@Injectable()
export class S3StorageStrategy implements StorageStrategy {
  private readonly logger = new Logger(S3StorageStrategy.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.getOrThrow<string>('AWS_REGION');
    this.bucket = this.configService.getOrThrow<string>('AWS_S3_BUCKET');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async upload(file: Express.Multer.File): Promise<FileUploadResult> {
    const ext = path.extname(file.originalname);
    const filename = `${UuidAdapter.getUuid()}${ext}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const filePath = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${filename}`;
    this.logger.log(`Archivo subido a S3: ${filePath}`);

    return { filename, path: filePath, size: file.size, mimetype: file.mimetype };
  }

  async uploadMany(files: Express.Multer.File[]): Promise<FileUploadResult[]> {
    return Promise.all(files.map((f) => this.upload(f)));
  }

  async getFile(key: string): Promise<NodeJS.ReadableStream> {
    const response = await this.s3Client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    return response.Body as Readable;
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}