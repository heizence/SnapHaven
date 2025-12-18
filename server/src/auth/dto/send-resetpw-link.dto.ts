import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendResetPWlinkReqDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '비밀번호 재설정 링크를 받을 이메일',
  })
  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일을 입력해주세요.' })
  email: string;
}
