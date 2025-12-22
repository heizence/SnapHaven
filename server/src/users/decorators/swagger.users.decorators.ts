import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiAcceptedResponse,
  ApiResponse,
  ApiExtraModels,
  getSchemaPath,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { GetProfileInfoResDto } from '../dto/get-profile-info.dto';
import { GetMediaItemsResDto } from 'src/media-items/dto/get-media-items.dto';

export function ApiGetProfileInfo() {
  return applyDecorators(
    ApiExtraModels(ResponseDto, GetProfileInfoResDto),
    ApiOperation({
      summary: '인증된 사용자 프로필 조회',
      description:
        'Access Token을 사용하여 본인의 프로필 상세 정보를 조회합니다.',
    }),
    ApiOkResponse({
      description: '프로필 조회 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(GetProfileInfoResDto) },
            },
          },
        ],
        example: {
          code: 200,
          message: '프로필 불러오기 성공',
          data: {
            id: 1,
            nickname: 'SnapMaster',
            profileImageKey: 'profiles/unique-image-key.jpg',
            authProvider: 'google',
            stats: {
              uploads: { count: 12, thumbnail: 'media/thumb1.jpg' },
              likes: { count: 45, thumbnail: 'media/thumb2.jpg' },
              collections: { count: 3, thumbnail: 'media/thumb3.jpg' },
            },
          },
        },
      },
    }),
  );
}

export function ApiEditProfileInfo() {
  return applyDecorators(
    ApiExtraModels(ResponseDto),
    ApiOperation({
      summary: '닉네임 및 비밀번호 수정',
      description:
        '현재 비밀번호를 확인한 후 닉네임과 비밀번호를 선택적으로 수정합니다.',
    }),
    ApiAcceptedResponse({
      description: '성공적으로 프로필 업데이트',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
        example: {
          code: 202,
          message: '프로필이 업데이트 되었습니다.',
          data: null,
        },
      },
    }),
    ApiResponse({
      status: 400,
      description:
        '기존 비밀번호와 새로운 비밀번호가 같음, 변경하려는 닉네임이나 비밀번호가 기존과 같음',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ResponseDto) },
          // 여기에 examples(복수형)를 사용하여 시나리오별로 나눕니다.
          examples: {
            '비밀번호가 동일': {
              value: {
                code: 400,
                message: '새 비밀번호는 기존 비밀번호와 달라야 합니다.',
                data: null,
              },
            },
            '닉네임이 동일': {
              value: {
                code: 400,
                message:
                  '변경하려는 닉네임이나 비밀번호가 기존과 같거나 누락되었습니다.',
                data: null,
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: '현재 비밀번호가 일치하지 않을 때',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
        example: {
          code: 401,
          message: '현재 비밀번호가 일치하지 않습니다.',
          data: null,
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: '닉네임 중복',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
        example: {
          code: 409,
          message: '이미 사용 중인 닉네임입니다.',
          data: null,
        },
      },
    }),
  );
}

export function ApiEditProfileImage() {
  return applyDecorators(
    ApiExtraModels(ResponseDto),
    ApiConsumes('multipart/form-data'),
    ApiOperation({
      summary: '프로필 이미지 업데이트',
      description:
        '이미지 파일을 업로드하고 새로운 프로필 이미지 키를 반환받습니다.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: '업로드할 이미지 파일',
          },
        },
      },
    }),
    ApiAcceptedResponse({
      description: '프로필 이미지 업로드 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: { type: 'string', example: 'profiles/123456....jpg' },
            },
          },
        ],
        example: {
          code: 202,
          message: '프로필 이미지가 변경되었습니다.',
          data: 'profiles/123456....jpg',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '업로드할 파일 누락, 잘못된 형식 업로드',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ResponseDto) },
          examples: {
            '파일 누락': {
              value: {
                code: 400,
                message: '업로드할 파일이 없습니다.',
                data: null,
              },
            },
            '잘못된 형식': {
              value: {
                code: 400,
                message: '이미지 파일만 업로드할 수 있습니다.',
                data: null,
              },
            },
          },
        },
      },
    }),
  );
}

export function ApiDeleteUser() {
  return applyDecorators(
    ApiExtraModels(ResponseDto),
    ApiOperation({
      summary: '사용자 계정 삭제(회원 탈퇴)',
      description: '비밀번호 확인 후 계정을 Soft Delete 처리합니다.',
    }),
    ApiOkResponse({
      description: '계정 삭제 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
        example: {
          code: 200,
          message: '계정이 삭제되었습니다.',
          data: null,
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: '비밀번호가 일치하지 않음.',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
        example: {
          code: 404,
          message: '현재 비밀번호가 일치하지 않습니다.',
          data: null,
        },
      },
    }),
  );
}

export function ApiGetMyUploads() {
  return applyDecorators(
    ApiExtraModels(ResponseDto, GetMediaItemsResDto),
    ApiOperation({
      summary: '내가 업로드한 콘텐츠 목록 조회',
      description: '본인이 소유한 미디어 및 앨범 대표 항목들을 조회합니다.',
    }),
    ApiOkResponse({
      description: '업로드 목록 조회 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(GetMediaItemsResDto) },
            },
          },
        ],
        example: {
          code: 200,
          message: '내 업로드 목록 조회 성공',
          data: {
            items: [
              {
                id: 101,
                title: 'My Photo',
                type: 'IMAGE',
                keyImageMedium: 'path/to/img.jpg',
              },
            ],
            totalCounts: 1,
          },
        },
      },
    }),
  );
}

export function ApiGetMyLikedContents() {
  return applyDecorators(
    ApiExtraModels(ResponseDto, GetMediaItemsResDto),
    ApiOperation({
      summary: '내가 좋아요한 콘텐츠 목록 조회',
      description:
        '사용자가 좋아요 표시한 미디어 및 앨범 목록을 최신순으로 조회합니다.',
    }),
    ApiOkResponse({
      description: '좋아요 목록 조회 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(GetMediaItemsResDto) },
            },
          },
        ],
        example: {
          code: 200,
          message: '좋아요 표시한 콘텐츠 조회 성공',
          data: {
            items: [
              {
                id: 202,
                title: 'Awesome View',
                type: 'IMAGE',
                isLikedByCurrentUser: true,
              },
            ],
          },
        },
      },
    }),
  );
}
