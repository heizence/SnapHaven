import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { Album } from 'src/albums/entities/album.entity';
import { MediaPipelineService } from './media-pipeline.service';
import { TagsModule } from 'src/tags/tags.module';
import { S3UtilityService } from './s3-utility.service';
import { MediaProcessorService } from './media-processor.service';

@Module({
  imports: [TypeOrmModule.forFeature([MediaItem, Album]), TagsModule],
  providers: [MediaPipelineService, S3UtilityService, MediaProcessorService],
  exports: [MediaPipelineService],
})
export class MediaPipelineModule {}
