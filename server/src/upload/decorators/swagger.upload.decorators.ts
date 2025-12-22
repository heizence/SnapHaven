import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiAcceptedResponse,
  ApiResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import {
  GetMediaPresignedUrlReqDto,
  GetMediaPresignedUrlResDto,
  RequestFileDto,
  PresignedUrlInfo,
} from '../dto/get-presigned-url.dto';

export function ApiGetMediaPresignedUrls() {
  return applyDecorators(
    // 중첩된 모든 DTO 모델을 등록해야 getSchemaPath가 작동합니다.
    ApiExtraModels(
      ResponseDto,
      GetMediaPresignedUrlReqDto,
      GetMediaPresignedUrlResDto,
      RequestFileDto,
      PresignedUrlInfo,
    ),
    ApiOperation({
      summary: 'S3 Presigned URL 발급 및 업로드 준비',
      description: [
        '클라이언트가 업로드할 파일 정보들을 배열로 보내면, 서버는 각 파일에 대응하는 S3 업로드용 URL을 생성하여 반환합니다.',
        '이 과정에서 DB에는 PENDING 상태의 미디어 레코드가 생성됩니다.',
      ].join('<br>'),
    }),
    ApiAcceptedResponse({
      description: 'Presigned URL 발급 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(GetMediaPresignedUrlResDto) },
            },
          },
        ],
        // DTO 구조에 맞춘 구체적인 예시
        example: {
          code: 202,
          message: '업로드 준비 및 Presigned Url 발급 완료',
          data: {
            urls: [
              {
                fileIndex: 0,
                signedUrl:
                  'https://snap-haven-bucket.s3.amazonaws.com/media-items/...',
                s3Key: 'media-items/uuid-1.jpg',
              },
              {
                fileIndex: 1,
                signedUrl:
                  'https://snap-haven-bucket.s3.amazonaws.com/media-items/...',
                s3Key: 'media-items/uuid-2.jpg',
              },
            ],
            albumId: 42, // 단일 파일 업로드 시 null이거나 생략될 수 있음
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '지원하지 않는 형식 또는 유효성 검사 실패',
      schema: {
        allOf: [{ $ref: getSchemaPath(ResponseDto) }],
        example: {
          code: 400,
          message: '지원하지 않는 형식입니다. (이미지/비디오만 가능)',
          data: null,
        },
      },
    }),
  );
}

export function ApiRequestFileProcessing() {
  return applyDecorators(
    ApiExtraModels(ResponseDto),
    ApiOperation({
      summary: '업로드 완료 후 파일 처리(파이프라인) 시작 요청',
      description: [
        '클라이언트가 S3 업로드를 마친 후 호출합니다.',
        '서버는 해당 파일의 상태를 PROCESSING으로 변경하고 비동기 변환(썸네일 생성, 트랜스코딩 등) 파이프라인을 가동합니다.',
      ].join('<br>'),
    }),
    ApiAcceptedResponse({
      description: '파이프라인 시작 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
        example: {
          code: 202,
          message: '파일 백그라운드 처리 중',
          data: null,
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청',
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ResponseDto) },
          examples: {
            '유효하지 않은 키': {
              value: {
                code: 400,
                message:
                  '완료할 유효한 PENDING 상태의 미디어 항목을 찾을 수 없습니다.',
                data: null,
              },
            },
          },
        },
      },
    }),
  );
}
