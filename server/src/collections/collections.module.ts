import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { Collection } from './entities/collection.entity';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { User } from 'src/users/entities/user.entity';
import { Album } from 'src/albums/entities/album.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Collection, MediaItem, Album, User])],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}
