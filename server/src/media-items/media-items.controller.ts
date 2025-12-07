import { Controller, Get, Query, HttpStatus, Param, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { MediaItemsService } from './media-items.service';
import { GetMediaItemsDto } from './dto/get-media-items.dto';
import { ResponseDto } from 'src/common/dto/response.dto';
import { PaginatedMediaItemsDto } from './dto/media-item-response.dto';
import { MediaItemDetailDto } from './dto/media-item-detail.dto';
import { User } from 'src/users/entities/user.entity';

@ApiTags('Media')
@Controller('media')
export class MediaItemsController {
  constructor(private readonly mediaItemsService: MediaItemsService) {}

  // 메인 피드 콘텐츠 목록 조회
  @Get('items')
  @ApiOperation({
    summary: '메인 피드 콘텐츠 목록 조회',
    description: '최신순/인기순 정렬 및 타입 필터링을 지원합니다.',
  })
  @ApiOkResponse({
    description: '성공적으로 미디어 목록 반환',
    type: PaginatedMediaItemsDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'popular'] })
  @ApiQuery({ name: 'type', required: false, enum: ['ALL', 'IMAGE', 'VIDEO'] })
  async getMediaFeeds(
    @Query() query: GetMediaItemsDto,
  ): Promise<ResponseDto<PaginatedMediaItemsDto>> {
    console.log('getMediaFeeds controller. query : ', query);
    const { message, items, totalCounts } =
      await this.mediaItemsService.findAll(query);
    return ResponseDto.success(HttpStatus.OK, message, { items, totalCounts });
  }

  /**
   * 단일 미디어 아이템 상세 정보 조회
   * 경로: GET /api/v1/media/content/:id
   */
  @Get('item/:id')
  @ApiOperation({
    summary: '단일 콘텐츠 상세 조회',
    description:
      '콘텐츠 ID를 사용하여 상세 정보, 태그, 통계 데이터를 조회합니다. 로그인된 경우 좋아요 상태를 포함합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '상세 정보 조회 성공',
    type: MediaItemDetailDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '콘텐츠를 찾을 수 없음',
  })
  async getMediaDetail(
    @Param('id') mediaId: number,
    // OptionalAuthGuard 사용 시 req.user는 로그인 상태가 아니면 undefined일 수 있습니다.
    @Req() req: { user?: User },
  ): Promise<ResponseDto<MediaItemDetailDto>> {
    // mediaId가 문자열로 넘어올 수 있으므로 숫자로 변환합니다.
    const id = Number(mediaId);
    const currentUserId = req.user ? req.user.id : undefined;

    const { message, item } = await this.mediaItemsService.findOne(
      id,
      currentUserId,
    );

    return ResponseDto.success(HttpStatus.OK, message, item);
  }
}
