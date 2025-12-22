import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiResponse,
  ApiExtraModels,
  getSchemaPath,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { CollectionDto } from '../dto/get-collections.dto';
import { GetCollectionContentsResDto } from '../dto/get-collection-contents.dto';
import { CreateCollectionResDto } from '../dto/create-collection.dto';
import { EditCollectionResDto } from '../dto/edit-collection.dto';

export function ApiCollectionCreate() {
  return applyDecorators(
    ApiExtraModels(ResponseDto, CreateCollectionResDto),
    ApiBearerAuth('bearerAuth'),
    ApiOperation({
      summary: '새 컬렉션(북마크 폴더) 생성',
      description:
        '사용자 고유의 컬렉션을 생성합니다. mediaId를 함께 보내면 생성과 동시에 해당 아이템을 컬렉션에 추가합니다.',
    }),
    ApiCreatedResponse({
      description: '컬렉션 생성 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(CreateCollectionResDto) },
            },
          },
        ],
        example: {
          code: 201,
          message: '새 컬렉션이 생성되었습니다.',
          data: { id: 7, name: '여행 기록', itemCount: 0, userId: 123 },
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: '컬렉션 이름 중복',
      schema: {
        allOf: [{ $ref: getSchemaPath(ResponseDto) }],
        example: {
          code: 409,
          message: '이미 [여행 기록] 이름의 컬렉션이 존재합니다.',
          data: null,
        },
      },
    }),
  );
}

export function ApiCollectionEdit() {
  return applyDecorators(
    ApiExtraModels(ResponseDto, EditCollectionResDto),
    ApiBearerAuth('bearerAuth'),
    ApiOperation({ summary: '컬렉션 이름 수정' }),
    ApiOkResponse({
      description: '수정 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: { data: { $ref: getSchemaPath(EditCollectionResDto) } },
          },
        ],
        example: {
          code: 200,
          message: '컬렉션 이름이 수정되었습니다.',
          data: { id: 7, name: '수정된 이름', itemCount: 0, userId: 123 },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: '컬렉션 없음 또는 권한 없음',
      schema: {
        allOf: [{ $ref: getSchemaPath(ResponseDto) }],
        example: {
          code: 404,
          message: '컬렉션을 찾을 수 없거나 수정 권한이 없습니다.',
          data: null,
        },
      },
    }),
  );
}

export function ApiCollectionDelete() {
  return applyDecorators(
    ApiExtraModels(ResponseDto),
    ApiBearerAuth('bearerAuth'),
    ApiOperation({ summary: '컬렉션 삭제 (Soft Delete)' }),
    ApiOkResponse({
      description: '삭제 성공',
      schema: {
        allOf: [{ $ref: getSchemaPath(ResponseDto) }],
        example: {
          code: 200,
          message: '컬렉션이 삭제되었습니다.',
          data: { deletedCollectionId: 7 },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: '삭제 대상 없음',
      schema: {
        allOf: [{ $ref: getSchemaPath(ResponseDto) }],
        example: {
          code: 404,
          message: '컬렉션을 찾을 수 없거나 삭제 권한이 없습니다.',
          data: null,
        },
      },
    }),
  );
}

export function ApiCollectionList() {
  return applyDecorators(
    ApiExtraModels(ResponseDto, CollectionDto),
    ApiBearerAuth('bearerAuth'),
    ApiOperation({
      summary: '사용자 컬렉션 목록 조회',
      description:
        '사용자가 생성한 모든 컬렉션과 각 컬렉션별 포함된 아이템 개수, 썸네일을 조회합니다.',
    }),
    ApiOkResponse({
      description: '목록 조회 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(CollectionDto) },
              },
            },
          },
        ],
        example: {
          code: 200,
          message: '컬렉션 목록 조회 성공',
          data: [
            {
              id: 1,
              name: '좋아하는 사진',
              itemCount: 12,
              thumbnailKey: 'media/thumb.jpg',
              isContentContained: false,
            },
          ],
        },
      },
    }),
  );
}

export function ApiGetCollectionContents() {
  return applyDecorators(
    ApiExtraModels(ResponseDto, GetCollectionContentsResDto),
    ApiBearerAuth('bearerAuth'),
    ApiOperation({ summary: '특정 컬렉션 상세 내용 조회' }),
    ApiOkResponse({
      description: '상세 조회 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(GetCollectionContentsResDto) },
            },
          },
        ],
        example: {
          code: 200,
          message: '컬렉션 내 콘텐츠 조회 성공',
          data: {
            id: 1,
            name: '여행 기록',
            userId: 123,
            totalItems: 1,
            items: [
              {
                id: 50,
                title: '제주 바다',
                type: 'IMAGE',
                keyImageSmall: '...',
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: '컬렉션 없음 또는 권한 없음',
      schema: {
        allOf: [{ $ref: getSchemaPath(ResponseDto) }],
        example: {
          code: 404,
          message: '컬렉션을 찾을 수 없거나 접근 권한이 없습니다.',
          data: null,
        },
      },
    }),
  );
}

export function ApiCollectionToggle() {
  return applyDecorators(
    ApiExtraModels(ResponseDto),
    ApiBearerAuth('bearerAuth'),
    ApiOperation({ summary: '컬렉션에 미디어 아이템 추가/제거 (토글)' }),
    ApiOkResponse({
      description: '토글 성공',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ResponseDto) },
          examples: {
            추가됨: {
              value: {
                code: 200,
                message: '해당 콘텐츠가 컬렉션에 추가되었습니다.',
                data: { isAdded: true },
              },
            },
            제거됨: {
              value: {
                code: 200,
                message: '해당 콘텐츠가 컬렉션에서 제거되었습니다.',
                data: { isAdded: false },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: '권한 없음',
      schema: {
        allOf: [{ $ref: getSchemaPath(ResponseDto) }],
        example: {
          code: 401,
          message: '이 컬렉션에 미디어를 추가할 권한이 없습니다.',
          data: null,
        },
      },
    }),
  );
}
