import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';

export class SigninDto {
  @IsEmail()
  @ApiProperty({
    description: '로그인할 사용자의 이메일',
    example: 'user@example.com',
    required: true,
  })
  email: string;

  @IsString()
  @ApiProperty({
    description: '로그인할 사용자의 비밀번호',
    example: 'password1234',
    required: true,
  })
  password: string;
}
