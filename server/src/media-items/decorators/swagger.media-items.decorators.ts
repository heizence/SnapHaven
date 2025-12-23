import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';
import { MediaSort } from 'src/media-items/dto/get-media-items.dto';
import {
  PaginatedMediaItemsExample,
  MediaItemDetailExample,
  AlbumDetailExample,
  GetDownloadUrlExample,
  GetAlbumDownloadUrlExample,
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
    ApiQuery({
      name: 'tag',
      required: false,
      type: String,
      description: '특정 태그로 필터링',
      example: '여행',
    }),
    ApiOkResponse({
      description: '성공적으로 피드 목록 반환',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: {
                type: 'GetMediaItemsResDto',
                example: PaginatedMediaItemsExample,
              },
            },
          },
        ],
        example: {
          code: 200,
          message: '전체 콘텐츠 불러오기 성공',
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
      summary: '단일 미디어 아이템 상세 조회',
      description: '단일 미디어 아이템의 상세 정보를 조회합니다.',
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
        '미디어 아이템 상세 조회 성공',
        MediaItemDetailExample,
      ),
    }),

    // 응답 실패 형식
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '해당 콘텐츠를 찾을 수 없음.',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
      },
      example: ResponseDto.fail(
        HttpStatus.NOT_FOUND,
        '요청하신 콘텐츠를 찾을 수 없거나 삭제되었습니다.',
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
        '앨범 ID를 사용하여 앨범 상세 정보와 포함된 하위 아이템 목록을 조회합니다.',
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
        '앨범 상세 조회 성공',
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
        '요청하신 앨범을 찾을 수 없거나 삭제되었습니다.',
        null,
      ),
    }),
  );
}

// 단일 콘텐츠 다운로드 URL 요청
export function ApiGetItemDownloadUrl() {
  return applyDecorators(
    ApiOperation({
      summary: '아이템 다운로드 링크 생성',
      description:
        '해당 콘텐츠 아이템의 원본 파일을 다운로드 하기 위한 S3 Presigned url 을 발급합니다.',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      description: '다운로드 URL 발급 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: {
                type: 'GetItemDownloadUrlResDto',
              },
            },
          },
        ],
      },
      example: ResponseDto.success(
        HttpStatus.OK,
        '다운로드 URL 발급 성공',
        GetDownloadUrlExample,
      ),
    }),

    // 응답 실패 형식
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '아이템을 찾을 수 없습니다.',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
      },
      example: ResponseDto.fail(
        HttpStatus.NOT_FOUND,
        '아이템을 찾을 수 없습니다.',
        null,
      ),
    }),
  );
}

// 앨범 내 모든 콘텐츠 다운로드 요청
export function ApiDownloadAlbum() {
  return applyDecorators(
    ApiOperation({
      summary: '앨범 다운로드 랑크 생성',
      description:
        '앨범 내 모든 아이템의 원본 파일을 다운로드 하기 위한 S3 Presigned url 을 발급해 줍니다.',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      description: '앨범 다운로드 URL 리스트 발급 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {},
          },
        ],
      },
      example: ResponseDto.success(
        HttpStatus.OK,
        '앨범 다운로드 URL 리스트 발급 성공',
        GetAlbumDownloadUrlExample,
      ),
    }),

    // 응답 실패 형식
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '앨범을 찾을 수 없습니다.',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
      },
      example: ResponseDto.fail(
        HttpStatus.NOT_FOUND,
        '앨범을 찾을 수 없습니다.',
        null,
      ),
    }),
  );
}

// 콘텐츠 좋아요 토글 기능
export function ApiLikeToggle() {
  return applyDecorators(
    ApiExtraModels(ResponseDto),
    ApiOperation({
      summary: '콘텐츠(단일 아이템, 앨범) 좋아요/취소',
      description:
        '인증된 사용자가 특정 콘텐츠에 좋아요를 표시하거나 취소합니다.',
    }),

    ApiResponse({
      status: 201,
      description: '좋아요 상태 변경 성공',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ResponseDto) },
          examples: {
            좋아요: {
              value: {
                code: 201,
                message: '좋아요 취소 처리가 완료되었습니다.',
                data: { isLiked: true },
              },
            },
            '좋아요 취소': {
              value: {
                code: 201,
                message: '좋아요 취소 처리가 취소되었습니다.',
                data: { isLiked: false },
              },
            },
          },
        },
      },
    }),

    // 응답 실패 형식
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: '인증 정보 없음',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
      },
      example: ResponseDto.fail(
        HttpStatus.UNAUTHORIZED,
        '로그인된 사용자만 좋아요를 누를 수 있습니다.',
        null,
      ),
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: '사용자 또는 콘텐츠를 찾을 수 없음',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
      },
      example: ResponseDto.fail(
        HttpStatus.NOT_FOUND,
        '사용자 또는 콘텐츠를 찾을 수 없습니다.',
        null,
      ),
    }),
  );
}
