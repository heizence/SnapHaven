import {
  Controller,
  Get,
  Query,
  HttpStatus,
  Param,
  Req,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MediaItemsService } from './media-items.service';
import {
  GetMediaItemsReqDto,
  GetMediaItemsResDto,
} from './dto/get-media-items.dto';
import { ResponseDto } from 'src/common/dto/response.dto';
import { User } from 'src/users/entities/user.entity';
import {
  ApiAlbumDetail,
  ApiDownloadAlbum,
  ApiGetItemDownloadUrl,
  ApiLikeToggle,
  ApiMediaDetail,
  ApiMediaFeed,
} from './decorators/swagger.media-items.decorators';
import { GetAlbumDetailResDto } from 'src/albums/dto/album-detail.dto';

import { AlbumsService } from 'src/albums/albums.service';

import { ToogleLikedResDto } from './dto/toggle-liked.response.dto';
import { OptionalAuthGuard } from 'src/auth/optional-auth.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetMediaItemDetailResDto } from './dto/get-media-item-detail.dto';
import {
  GetAlbumDownloadUrlsResDto,
  GetItemDownloadUrlResDto,
} from './dto/get-download-urls.dto';

@ApiTags('Media Items')
@Controller('media')
export class MediaItemsController {
  constructor(
    private readonly mediaItemsService: MediaItemsService,
    private readonly albumsService: AlbumsService,
  ) {}

  // 메인 피드 콘텐츠 목록 조회
  @Get('items')
  @UseGuards(OptionalAuthGuard)
  @ApiMediaFeed()
  async getMediaFeeds(
    @Query() query: GetMediaItemsReqDto,
    @Req() req: { user?: User },
  ): Promise<ResponseDto<GetMediaItemsResDto>> {
    const currentUserId = req.user?.id;
    console.log('items controller. user : ', currentUserId);
    const { message, items, totalCounts } =
      await this.mediaItemsService.findAll(query, currentUserId);

    return ResponseDto.success(HttpStatus.OK, message, { items, totalCounts });
  }

  // 단일 미디어 아이템 상세 정보 조회
  @Get('item/:id')
  @UseGuards(OptionalAuthGuard)
  @ApiMediaDetail()
  async getMediaDetail(
    @Param('id') mediaId: number,
    @Req() req: { user?: User },
  ): Promise<ResponseDto<GetMediaItemDetailResDto>> {
    const id = Number(mediaId);
    const currentUserId = req.user ? req.user.id : undefined;
    const { message, item } = await this.mediaItemsService.findOne(
      id,
      currentUserId,
    );

    return ResponseDto.success(HttpStatus.OK, message, item);
  }

  // 앨범 상세 조회
  @Get('album/:id')
  @UseGuards(OptionalAuthGuard)
  @ApiAlbumDetail()
  async getAlbumDetail(
    @Param('id') albumId: number,
    @Req() req: { user?: User },
  ): Promise<ResponseDto<GetAlbumDetailResDto>> {
    const id = Number(albumId);
    const currentUserId = req.user ? req.user.id : undefined;
    const { message, album } = await this.albumsService.findAlbumContents(
      id,
      currentUserId,
    );

    return ResponseDto.success(HttpStatus.OK, message, album);
  }

  // 단일 콘텐츠 다운로드 URL 요청
  @Get(':id/download')
  @ApiGetItemDownloadUrl()
  async getItemDownloadUrl(
    @Param('id') mediaId: number,
  ): Promise<ResponseDto<GetItemDownloadUrlResDto>> {
    const id = Number(mediaId);
    const { message, data } =
      await this.mediaItemsService.getItemDownloadUrl(id);

    return ResponseDto.success(HttpStatus.OK, message, data);
  }

  /**
   * 앨범 전체 콘텐츠를 ZIP 파일로 다운로드
   * 주의: 스트리밍 다운로드는 NestJS 표준 응답 형식을 사용하지 않음.
   */
  @Get('albums/:id/download')
  @ApiDownloadAlbum()
  async getAlbumDownloadUrls(
    @Param('id') albumId: number,
  ): Promise<ResponseDto<GetAlbumDownloadUrlsResDto>> {
    const id = Number(albumId);

    const { message, data } = await this.albumsService.getAlbumDownloadUrls(id);
    return ResponseDto.success(HttpStatus.OK, message, data);
  }

  // 콘텐츠 좋아요 토글 기능(단일 콘텐츠, 앨범 모두 처리)
  @Post('item/like/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiLikeToggle()
  async toggleLikedItem(
    @Param('id') mediaId: number,
    @Req() req: { user: User },
  ): Promise<ResponseDto<ToogleLikedResDto>> {
    const userId = req.user.id;
    const { message, isLiked } = await this.mediaItemsService.toggleLikedItem(
      mediaId,
      userId,
    );

    return ResponseDto.success(HttpStatus.CREATED, message, { isLiked });
  }
}
