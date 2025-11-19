import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: '이메일로 받은 비밀번호 재설정 토큰',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'newPassword123!',
    description: '새로운 비밀번호 (8자 이상, 영문+숫자 포함)',
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).*$/, {
    message: '비밀번호는 영문자와 숫자를 최소 1개씩 포함해야 합니다.',
  })
  newPassword: string;
}
