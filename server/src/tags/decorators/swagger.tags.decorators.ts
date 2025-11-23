import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';
import { TagDto } from 'src/tags/dto/tag.dto';

export function ApiGetAllTags() {
  return applyDecorators(
    ApiExtraModels(ResponseDto, TagDto),
    ApiOperation({
      summary: '모든 태그 목록 조회',
      description: '앱 내에서 사용되는 모든 태그 목록을 반환합니다. ',
    }),
    ApiOkResponse({
      description: '태그 목록 조회 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              code: { type: 'number', example: 200 },
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(TagDto) },
              },
            },
          },
        ],
        example: {
          code: 200,
          message: '태그 목록 조회 성공',
          data: [
            { id: 1, name: '풍경' },
            { id: 2, name: '하늘' },
            { id: 3, name: '바다' },
            { id: 4, name: '도시' },
            { id: 5, name: '야경' },
            { id: 6, name: '인물' },
            { id: 7, name: '동물' },
            { id: 8, name: '여행' },
            { id: 9, name: '음식' },
            { id: 10, name: '건축' },
            { id: 11, name: '자연' },
            { id: 12, name: '숲' },
            { id: 13, name: '기타' },
          ],
        },
      },
    }),
  );
}
