import { applyDecorators, HttpStatus } from '@nestjs/common';
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
  AlbumDetailExample,
} from 'src/media-items/decorators/media-swagger.examples';
import { ResponseDto } from 'src/common/dto/response.dto';

// 메인 피드 목록 조회
export function ApiMediaFeed() {
  return applyDecorators(
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

// 단일 콘텐츠 상세 조회
export function ApiMediaDetail() {
  return applyDecorators(
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

// 앨범 상세 조회
export function ApiAlbumDetail() {
  return applyDecorators(
    ApiOperation({
      summary: '앨범 상세 조회',
      description:
        '앨범 ID를 사용하여 앨범 정보와 포함된 모든 ACTIVE 콘텐츠 목록을 조회합니다. 로그인된 경우 좋아요 상태를 포함합니다.',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      description: '앨범 상세 정보 조회 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: {
                type: 'AlbumDetailResponseDto',
              },
            },
          },
        ],
      },
      example: ResponseDto.success(
        HttpStatus.OK,
        '앨범 상세 정보 조회 성공',
        AlbumDetailExample,
      ),
    }),

    // 응답 실패 형식
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '앨범을 찾을 수 없음.',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
      },
      example: ResponseDto.fail(
        HttpStatus.NOT_FOUND,
        '요청하신 앨범을 찾을 수 없습니다.',
        null,
      ),
    }),
  );
}
