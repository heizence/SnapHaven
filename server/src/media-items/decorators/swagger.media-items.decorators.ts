import { applyDecorators, Get, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { MediaSort } from 'src/media-items/dto/get-media-items.dto';
import {
  PaginatedMediaItemsExample,
  MediaItemDetailExample,
} from 'src/media-items/decorators/media-swagger.examples';
import { ResponseDto } from 'src/common/dto/response.dto';

// 메인 피드 목록 조회 엔드포인트 Swagger 통합
export function ApiMediaFeed() {
  return applyDecorators(
    Get('items'),
    ApiOperation({
      summary: '메인 피드 콘텐츠 목록 조회',
      description:
        '최신순/인기순 정렬 및 타입/키워드 필터링을 지원합니다. (Limit: 40 고정)',
    }),

    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 40 }),
    ApiQuery({
      name: 'sort',
      required: false,
      enum: MediaSort,
      example: MediaSort.POPULAR,
    }),
    ApiQuery({
      name: 'type',
      required: false,
      enum: ['ALL', 'IMAGE', 'VIDEO'],
      example: 'IMAGE',
    }),
    ApiQuery({
      name: 'keyword',
      required: false,
      type: String,
      description: '제목 또는 설명 검색',
      example: '파리',
    }),
    ApiOkResponse({
      description: '성공적으로 미디어 목록 반환',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: {
                type: 'PaginatedMediaItemsDto',
                example: PaginatedMediaItemsExample,
              },
            },
          },
        ],
        example: {
          code: 200,
          message: '미디어 피드 조회 성공',
          data: PaginatedMediaItemsExample,
        },
      },
    }),
  );
}

// 단일 콘텐츠 상세 조회 엔드포인트 Swagger 통합
export function ApiMediaDetail() {
  return applyDecorators(
    Get('item/:id'),
    ApiOperation({
      summary: '단일 콘텐츠 상세 조회',
      description:
        '콘텐츠 ID를 사용하여 상세 정보, 태그, 통계 데이터를 조회합니다.',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      description: '상세 정보 조회 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: {
                type: 'MediaItemDetailDto',
              },
            },
          },
        ],
      },
      example: ResponseDto.success(
        HttpStatus.OK,
        '콘텐츠 상세 조회 성공',
        MediaItemDetailExample,
      ),
    }),

    // 응답 실패 형식
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '콘텐츠를 찾을 수 없음.',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
      },
      example: ResponseDto.fail(
        HttpStatus.NOT_FOUND,
        '요청하신 콘텐츠를 찾을 수 없습니다.',
        null,
      ),
    }),
  );
}
