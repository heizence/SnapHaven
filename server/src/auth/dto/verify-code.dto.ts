import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class VerifyCodeReqDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '인증 코드를 받은 이메일',
  })
  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  email: string;

  @ApiProperty({
    example: '1234abc',
    description: '이메일로 받은 인증 코드',
  })
  @IsNotEmpty({ message: '인증 코드를 입력해주세요.' })
  code: string;
}
