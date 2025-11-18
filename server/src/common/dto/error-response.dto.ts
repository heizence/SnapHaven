import { ApiProperty } from '@nestjs/swagger';
import { ResponseDto } from './response.dto'; // 공용 ResponseDto

/**
 * 공통 에러 응답 DTO
 * HttpExceptionFilter가 반환하는 형식
 */
export class ErrorResponseDto extends ResponseDto<null> {
  @ApiProperty({
    example: 404,
    description: 'HTTP 상태 코드',
  })
  declare code: number; // declare : 이미 있는 속성 다시 선언하기

  @ApiProperty({
    example: 'Not Found',
    description: '에러 메시지',
  })
  declare message: string;

  @ApiProperty({
    example: null,
    description: '데이터 (null)',
    nullable: true,
  })
  declare data: null;
}
