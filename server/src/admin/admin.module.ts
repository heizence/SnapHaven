import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { S3UtilityService } from 'src/media-pipeline/s3-utility.service';
import { Album } from 'src/albums/entities/album.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaItem]),
    TypeOrmModule.forFeature([Album]),
  ],
  controllers: [AdminController],
  providers: [AdminService, S3UtilityService],
  exports: [AdminService],
})
export class AdminModule {}
