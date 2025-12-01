import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { Album } from 'src/albums/entities/album.entity';
import { MediaPipelineService } from './media-pipeline.service';
import { TagsModule } from 'src/tags/tags.module';
import { S3UtilityService } from './s3-utility.service';
import { MediaProcessorService } from './media-processor.service';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as multerS3 from 'multer-s3';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client } from '@aws-sdk/client-s3';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaItem, Album]),
    TagsModule,

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
  providers: [MediaPipelineService, S3UtilityService, MediaProcessorService],
  exports: [MediaPipelineService],
})
export class MediaPipelineModule {}
