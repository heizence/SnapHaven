import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { S3UtilityService } from 'src/media-pipeline/s3-utility.service';
import { ValidationService } from 'src/upload/validation.service';
import { MediaItemsService } from 'src/media-items/media-items.service';
import { Album } from 'src/albums/entities/album.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, MediaItem, Album])],
  controllers: [UsersController],
  providers: [
    UsersService,
    S3UtilityService,
    ValidationService,
    MediaItemsService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
