import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaItemsService } from './media-items.service';
import { MediaItemsController } from './media-items.controller';
import { MediaItem } from './entities/media-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MediaItem])],
  controllers: [MediaItemsController],
  providers: [MediaItemsService],
})
export class MediaItemsModule {}
