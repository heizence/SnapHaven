import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { MediaPipelineModule } from 'src/media-pipeline/media-pipeline.module';
import { ValidationService } from './validation.service';
import { MulterModule } from '@nestjs/platform-express';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import * as multerS3 from 'multer-s3';

@Module({
  imports: [
    MediaPipelineModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const region = configService.get('AWS_REGION')!;
        const bucket = configService.get('AWS_S3_ORIGINALS_BUCKET')!; // Private 버킷

        // 1. S3 Client 초기화 (IAM Role 또는 환경 변수 사용)
        const s3Client = new S3Client({
          region: region,
        });

        return {
          storage: multerS3({
            s3: s3Client,
            bucket: bucket,
            acl: 'private',
            key: (req, file, cb) => {
              const uniqueId = uuidv4();
              const fileExtension = path.extname(file.originalname);
              const s3Key = `media_items/${uniqueId}${fileExtension}`;
              cb(null, s3Key); // Key를 S3에 전송
            },
            contentType: multerS3.AUTO_CONTENT_TYPE,
          }),
          limits: { fileSize: 200 * 1024 * 1024 },
        };
      },
    }),
  ],

  controllers: [UploadController],
  providers: [ValidationService],
})
export class UploadModule {}
