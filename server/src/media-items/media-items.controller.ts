import { Controller, Get, Query, HttpStatus, Param, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MediaItemsService } from './media-items.service';
import { GetMediaItemsDto } from './dto/get-media-items.dto';
import { ResponseDto } from 'src/common/dto/response.dto';
import { PaginatedMediaItemsDto } from './dto/media-item-response.dto';
import { MediaItemDetailDto } from './dto/media-item-detail.dto';
import { User } from 'src/users/entities/user.entity';
import {
  ApiAlbumDetail,
  ApiMediaDetail,
  ApiMediaFeed,
} from './decorators/swagger.media-items.decorators';
import { AlbumDetailResponseDto } from 'src/albums/dto/album-detail.dto';

@ApiTags('Media Items')
@Controller('media')
export class MediaItemsController {
  constructor(private readonly mediaItemsService: MediaItemsService) {}

  // 메인 피드 콘텐츠 목록 조회
  @Get('items')
  @ApiMediaFeed()
  async getMediaFeeds(
    @Query() query: GetMediaItemsDto,
  ): Promise<ResponseDto<PaginatedMediaItemsDto>> {
    const { message, items, totalCounts } =
      await this.mediaItemsService.findAll(query);
    return ResponseDto.success(HttpStatus.OK, message, { items, totalCounts });
  }

  // 단일 미디어 아이템 상세 정보 조회
  @Get('item/:id')
  @ApiMediaDetail()
  async getMediaDetail(
    @Param('id') mediaId: number,
    @Req() req: { user?: User },
  ): Promise<ResponseDto<MediaItemDetailDto>> {
    const id = Number(mediaId);
    const currentUserId = req.user ? req.user.id : undefined;

    const { message, item } = await this.mediaItemsService.findOne(
      id,
      currentUserId,
    );

    return ResponseDto.success(HttpStatus.OK, message, item);
  }

  @Get('album/:id')
  @ApiAlbumDetail()
  async getAlbumDetail(
    @Param('id') albumId: number,
    @Req() req: { user?: User },
  ): Promise<ResponseDto<AlbumDetailResponseDto>> {
    const id = Number(albumId);
    const currentUserId = req.user ? req.user.id : undefined;
    const { message, album } = await this.mediaItemsService.findAlbumContents(
      id,
      currentUserId,
    );

    return ResponseDto.success(HttpStatus.OK, message, album);
  }
}
