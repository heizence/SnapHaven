import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { MediaPipelineModule } from 'src/media-pipeline/media-pipeline.module';
import { ValidationService } from './validation.service';

import { S3UtilityService } from 'src/media-pipeline/s3-utility.service';

import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { Album } from 'src/albums/entities/album.entity';
import { TagsModule } from 'src/tags/tags.module';
import { MediaProcessorService } from 'src/media-pipeline/media-processor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaItem, Album]),
    TagsModule,
    MediaPipelineModule,
  ],

  controllers: [UploadController],
  providers: [ValidationService, S3UtilityService, MediaProcessorService],
})
export class UploadModule {}
