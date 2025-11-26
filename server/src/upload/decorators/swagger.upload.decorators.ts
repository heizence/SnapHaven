import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiAcceptedResponse,
  ApiResponse,
  getSchemaPath,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';

export function ApiContentUpload(
  summary: string,
  description: string,
  isVideo: boolean = false,
  isMultiple: boolean = false,
) {
  const fileFieldName = isMultiple ? 'files' : 'file';
  const mediaIdKey = isMultiple ? 'mediaIds' : 'mediaId';
  const bodySchema = {
    type: 'object',
    properties: {
      [fileFieldName]: {
        type: 'array',
        items: { type: 'string', format: 'binary' },
        description: `업로드할 ${isVideo ? '비디오' : '이미지'} 파일${isMultiple ? ' 목록' : ''}`,
      },
      title: { type: 'string', description: '미디어 제목 (최대 30자)' },
      description: {
        type: 'string',
        description: '미디어 상세 설명 (최대 500자, 선택 사항)',
      },
      tags: { type: 'string', description: '태그 (쉼표 구분, 선택 사항)' },
    },
    required: [fileFieldName, 'title'],
  };

  //  mediaId/mediaIds의 예시 값 결정
  const mediaIdExample = isMultiple ? [123, 124] : 123;
  const mediaIdType = isMultiple ? 'array' : 'number';

  return applyDecorators(
    //  인증 필수
    ApiBearerAuth('bearerAuth'),
    ApiResponse({
      status: 401,
      description: '인증 실패 (JWT Access Token 필요)',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
        example: {
          code: 401,
          message: '인증 실패 (JWT Access Token 필요)',
          data: null,
        },
      },
    }),

    // Multipart/form-data 명시
    ApiConsumes('multipart/form-data'),
    ApiBody({ schema: bodySchema }),

    // 파일 제한 검증
    ApiResponse({
      status: 413,
      description: `용량 초과 (최대 ${isVideo ? '200MB' : '20MB'})`,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
        example: {
          code: 413,
          message: '각 파일 용량은 최대 20MB 까지 허용됩니다.',
          data: null,
        },
      },
    }),
    ...(isVideo
      ? [
          ApiResponse({
            status: 400,
            description: '영상 길이 초과 (60초 초과)',
            schema: {
              allOf: [
                { $ref: getSchemaPath(ResponseDto) },
                { properties: { data: { type: 'null' } } },
              ],
              example: {
                code: 409,
                message: '영상 길이는 최대 60초까지 허용됩니다.',
                data: null,
              },
            },
          }),
        ]
      : []),

    // [성공] 비동기 처리 시작
    ApiAcceptedResponse({
      description: '업로드 접수 및 백그라운드 처리 시작',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              code: { type: 'number', example: 202 },
              data: {
                type: 'object',
                properties: {
                  // 동적 키와 타입 정의
                  [mediaIdKey]: {
                    type: mediaIdType,
                    items: isMultiple ? { type: 'number' } : undefined,
                    example: mediaIdExample,
                  },
                },
              },
            },
          },
        ],
        example: {
          code: 202,
          message: 'Upload accepted, processing started.',
          data: isMultiple
            ? { mediaIds: mediaIdExample }
            : { mediaId: mediaIdExample }, // 예시 데이터
        },
      },
    }),

    ApiOperation({ summary, description }),
  );
}

export const ApiUploadImages = () =>
  ApiContentUpload(
    '이미지 묶음 (앨범) 업로드',
    '이미지 파일 배열과 메타데이터를 받아 백그라운드 처리를 요청합니다.',
    false,
    true,
  );

export const ApiUploadVideo = () =>
  ApiContentUpload(
    '비디오 단일 업로드',
    '비디오 파일과 메타데이터를 받아 백그라운드 처리를 요청합니다.',
    true,
    false,
  );
