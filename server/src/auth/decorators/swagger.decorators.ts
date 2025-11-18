import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiResponse,
  ApiExtraModels,
  getSchemaPath,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ResponseDto } from 'src/common/dto/response.dto';

export function ApiSignin() {
  return applyDecorators(
    ApiExtraModels(ResponseDto),
    ApiOperation({
      summary: '로그인',
      description:
        '이메일과 비밀번호로 로그인하고 JWT(access_token)를 발급받습니다.',
    }),

    ApiOkResponse({
      description: '로그인 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: {
                type: 'string',
                example:
                  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVt...',
              },
            },
          },
        ],
        example: {
          message: '로그인 성공',
          data: {
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: '인증 실패 (이메일 또는 비밀번호 오류)',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
        example: {
          message: '이메일 또는 비밀번호를 확인하세요.',
          data: null,
        },
      },
    }),
  );
}

export function ApiSignUp() {
  return applyDecorators(
    ApiExtraModels(ResponseDto),
    ApiOperation({
      summary: '회원가입',
      description: '새로운 사용자를 등록합니다.',
    }),
    ApiCreatedResponse({
      description: '회원가입 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: { type: 'null' },
            },
          },
        ],
        example: {
          message: '회원가입이 완료되었습니다.',
          data: null,
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: '중복 오류 (이미 존재하는 이메일 또는 닉네임)',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
        example: {
          message: '이미 사용 중인 이메일(닉네임)입니다.',
          data: null,
        },
      },
    }),
  );
}

export function ApiCheckNickname() {
  return applyDecorators(
    ApiExtraModels(ResponseDto),
    ApiOperation({
      summary: '닉네임 중복 확인',
      description: '회원가입 시 사용할 닉네임이 이미 존재하는지 확인합니다.',
    }),
    ApiQuery({
      name: 'nickname',
      type: String,
      description: '중복 확인할 닉네임',
      example: 'testuser',
      required: true,
    }),
    ApiOkResponse({
      description: '사용 가능한 닉네임입니다.',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
        example: {
          message: '사용 가능한 닉네임입니다.',
          data: null,
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: '이미 사용 중인 닉네임입니다.',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
        example: {
          message: '이미 사용 중인 닉네임입니다.',
          data: null,
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '유효성 검사 실패 (e.g., 닉네임이 너무 짧음)',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
        example: {
          message: '닉네임은 2자 이상이어야 합니다.',
          data: null,
        },
      },
    }),
  );
}

export function ApiRefreshToken() {
  return applyDecorators(
    ApiExtraModels(ResponseDto),
    ApiOperation({
      summary: 'Token 갱신',
      description: [
        'HTTP-Only Cookie로 전달된 Refresh Token을 검증하여 새로운 Access Token을 발급받습니다.',
        '<br>',
        '<b>[Swagger UI에서 테스트 시 참고]</b>',
        'Swagger UI는 브라우저의 HttpOnly 쿠키를 자동으로 저장/전송하지 못합니다.',
        '1. `/auth/signin` 실행 (개발자 도구 Network 탭 확인)',
        '2. 응답 헤더(Set-Cookie)의 `refreshToken` 값을 복사',
        '3. 이 API의 "Try it out" 클릭 후 `refreshToken` 파라미터(cookie)에 붙여넣기',
      ].join('<br>'),
    }),

    ApiOkResponse({
      description: '토큰 갱신 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          {
            properties: {
              data: {
                type: 'string',
                example:
                  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVt...',
              },
            },
          },
        ],
        example: {
          message: '토큰 갱신 성공',
          data: {
            access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: '인증 실패 (유효하지 않거나 만료된 Refresh Token)',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
        example: {
          message: '유효하지 않은 토큰입니다.',
          data: null,
        },
      },
    }),
  );
}

export function ApiSignout() {
  return applyDecorators(
    ApiBearerAuth('bearerAuth'), // 'main.ts'의 Bearer scheme 이름
    ApiExtraModels(ResponseDto),
    ApiOperation({
      summary: '로그아웃',
      description:
        'Access Token을 사용하여 로그아웃을 처리하고 토큰 버전을 올려 이미 발급된 Token을 무효화합니다.',
    }),
    ApiOkResponse({
      description: '로그아웃 성공',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } }, // data: null
        ],
        example: {
          message: '로그아웃 되었습니다.',
          data: null,
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: '인증 실패 (유효하지 않은 Access Token)',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDto) },
          { properties: { data: { type: 'null' } } },
        ],
        example: {
          message: 'Unauthorized',
          data: null,
        },
      },
    }),
  );
}
