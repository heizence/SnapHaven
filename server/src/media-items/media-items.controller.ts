import {
  Controller,
  Get,
  Query,
  HttpStatus,
  Param,
  Req,
  Post,
  Res,
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
import {
  GetItemDownloadUrlReqDto,
  GetItemDownloadUrlResDto,
} from './dto/get-item-download.dto';
import { AlbumsService } from 'src/albums/albums.service';

import { ToogleLikedResDto } from './dto/toggle-liked.response.dto';
import { OptionalAuthGuard } from 'src/auth/optional-auth.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GetMediaItemDetailResDto } from './dto/get-media-item-detail.dto';

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
    console.log('currentUserId : ', currentUserId);
    const { message, album } = await this.albumsService.findAlbumContents(
      id,
      currentUserId,
    );

    return ResponseDto.success(HttpStatus.OK, message, album);
  }

  // 단일 콘텐츠 다운로드 URL 요청
  @Get('download')
  @ApiGetItemDownloadUrl()
  async getItemDownloadUrl(
    @Query() query: GetItemDownloadUrlReqDto,
  ): Promise<ResponseDto<GetItemDownloadUrlResDto>> {
    const { message, data } =
      await this.mediaItemsService.getItemDownloadUrl(query);

    return ResponseDto.success(HttpStatus.OK, message, data);
  }

  /**
   * 앨범 전체 콘텐츠를 ZIP 파일로 다운로드
   * 주의: 스트리밍 다운로드는 NestJS 표준 응답 형식을 사용하지 않음.
   */
  @Post('album/download/:id')
  @ApiDownloadAlbum()
  async downloadAlbumZip(
    @Param('id') albumId: number,
    @Res({ passthrough: true }) res: any,
  ): Promise<void> {
    console.log('## album/download/:id request incoming!!');
    const id = Number(albumId);

    try {
      console.log('[downloadAlbumZip controller]start');
      // Service에서 스트리밍 및 응답 헤더 설정을 모두 처리
      await this.albumsService.downloadAlbumZip(id, res);
      console.log('[downloadAlbumZip controller]finished');
    } catch (error) {
      // 오류 발생 시 NestJS 기본 예외 처리 방식을 따르지 않고, Response 객체에 직접 오류를 작성
      const status = error.getStatus
        ? error.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error.message || 'ZIP 파일 다운로드 중 서버 오류가 발생했습니다.';

      // 오류 발생 시 스트리밍을 종료하고 오류 메시지를 반환
      res.status(status).send({
        statusCode: status,
        message: message,
      });
    }
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

    //console.log('id : ', id);
    const { message, isLiked } = await this.mediaItemsService.toggleLikedItem(
      mediaId,
      userId,
    );

    return ResponseDto.success(HttpStatus.CREATED, message, { isLiked });
  }
}
