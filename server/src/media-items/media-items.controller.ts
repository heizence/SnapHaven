import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { MediaItemsService } from './media-items.service';
import { GetMediaItemsDto } from './dto/get-media-items.dto';
import { ResponseDto } from 'src/common/dto/response.dto';
import { PaginatedMediaItemsDto } from './dto/media-item-response.dto';

@ApiTags('Media')
@Controller('media')
export class MediaItemsController {
  constructor(private readonly mediaItemsService: MediaItemsService) {}

  /**
   * 메인 피드 콘텐츠 목록 조회
   */
  @Get('/items')
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
    const data = await this.mediaItemsService.findAll(query);
    return ResponseDto.success(HttpStatus.OK, '미디어 피드 조회 성공', data);
  }
}
