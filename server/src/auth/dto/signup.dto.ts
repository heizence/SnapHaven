import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  @ApiProperty({
    description: '가입할 사용자의 이메일',
    example: 'newuser@example.com',
    required: true,
  })
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @ApiProperty({
    description: '가입할 사용자의 비밀번호 (8자 이상)',
    example: 'strongpassword123!',
    required: true,
    minLength: 8,
  })
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  nickname: string;
}
