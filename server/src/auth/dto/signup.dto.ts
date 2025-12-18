import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class SignUpReqDto {
  @IsEmail()
  @ApiProperty({
    description: '가입할 사용자의 이메일',
    example: 'newuser@example.com',
    required: true,
  })
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
    message:
      '새 비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.',
  })
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
