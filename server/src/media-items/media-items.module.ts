import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaItemsService } from './media-items.service';
import { MediaItemsController } from './media-items.controller';
import { MediaItem } from './entities/media-item.entity';
import { Album } from 'src/albums/entities/album.entity';
import { S3UtilityService } from 'src/media-pipeline/s3-utility.service';
import { AlbumsService } from 'src/albums/albums.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaItem]),
    TypeOrmModule.forFeature([Album]),
  ],
  controllers: [MediaItemsController],
  providers: [MediaItemsService, AlbumsService, S3UtilityService],
})
export class MediaItemsModule {}
