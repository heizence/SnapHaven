import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CollectionResponseDto } from '../dto/collection-response.dto';
import { CollectionContentsResponseDto } from '../dto/collection-contents-response.dto';
import { CollectionListResponseDto } from '../dto/collection-list-response.dto';

const CollectionCreationExample = {
  id: 7,
  name: '여행 기록',
  itemCount: 0,
  userId: 123,
};
const CollectionToggleExample = { isAdded: true };

// 새 컬렉션 생성
export function ApiCollectionCreate() {
  return applyDecorators(
    ApiOperation({ summary: '새 컬렉션(북마크 폴더) 생성' }),
    ApiBearerAuth('bearerAuth'),
    ApiCreatedResponse({
      description: '컬렉션 생성 성공 (HTTP 201)',
      type: CollectionResponseDto,
      schema: {
        example: {
          code: HttpStatus.CREATED,
          message: '컬렉션이 성공적으로 생성되었습니다.',
          data: CollectionCreationExample,
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: '컬렉션 이름 중복 오류',
      schema: {
        example: {
          code: HttpStatus.CONFLICT,
          message: '이미 [컬렉션 이름] 이름의 컬렉션이 존재합니다.',
          data: null,
        },
      },
    }),
  );
}

// 컬렉션 수정
export function ApiCollectionUpdate() {
  return applyDecorators(
    ApiOperation({
      summary: '컬렉션 이름 수정',
      description: '소유한 컬렉션의 이름을 변경합니다.',
    }),
    ApiOkResponse({
      description: '이름 수정 성공',
      type: CollectionResponseDto,
    }),
    ApiResponse({
      status: 404,
      description: '컬렉션을 찾을 수 없거나 수정 권한이 없습니다.',
    }),
    ApiResponse({
      status: 409,
      description: '컬렉션 이름 중복 오류',
    }),
  );
}

// 컬렉션 삭제
export function ApiCollectionDelete() {
  return applyDecorators(
    ApiOperation({ summary: '컬렉션 삭제 (Soft Delete)' }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: '컬렉션이 성공적으로 삭제(Soft Delete)되었습니다.',
    }),
    ApiResponse({
      status: 404,
      description: '컬렉션을 찾을 수 없거나 삭제 권한이 없습니다.',
    }),
  );
}

// 사용자 컬렉션 목록 조회
export function ApiCollectionList() {
  return applyDecorators(
    ApiOperation({ summary: '사용자가 생성한 컬렉션 목록 조회' }),
    ApiBearerAuth('bearerAuth'),
    ApiOkResponse({
      description: '컬렉션 목록 조회 성공',
      type: [CollectionListResponseDto],
      schema: {
        example: {
          code: HttpStatus.OK,
          message: '컬렉션 목록 조회 성공',
          data: [CollectionCreationExample],
        },
      },
    }),
  );
}

// 특정 컬렉션 상세 내용 조회
export function ApiGetCollectionContents() {
  return applyDecorators(
    ApiOperation({
      summary: '특정 컬렉션의 상세 내용 및 미디어 아이템 목록 조회',
    }),
    ApiBearerAuth('bearerAuth'),
    ApiOkResponse({
      description: '컬렉션 상세 조회 성공',
      type: CollectionContentsResponseDto,
      schema: {
        example: {
          code: HttpStatus.OK,
          message: '컬렉션 상세 조회 성공',
          // data는 CollectionDetailResponseDto (내부에 MediaItemResponseDto[] 포함)
          data: {
            id: 1,
            name: '여행 기록',
            totalItems: 3,
            items: [{ id: 123, title: 'Photo 1', urlSmall: '...' }],
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: '컬렉션을 찾을 수 없거나 접근 권한이 없음',
    }),
  );
}

// 미디어 추가/제거 (Toggle)
export function ApiCollectionToggle() {
  return applyDecorators(
    ApiOperation({ summary: '컬렉션에 미디어 아이템 추가/제거 (토글)' }),
    ApiBearerAuth('bearerAuth'),
    ApiOkResponse({
      description: '미디어 아이템 추가 또는 제거 완료',
      schema: {
        example: {
          code: HttpStatus.OK,
          message: '컬렉션에 추가되었습니다.',
          data: CollectionToggleExample,
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: '컬렉션 또는 미디어 아이템을 찾을 수 없음',
    }),
  );
}
