import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';
import { UserRole } from 'src/users/user-role.enum';

export class SigninReqDto {
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

export class SigninResDto {
  @IsString()
  @ApiProperty({
    description: '액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVt...',
  })
  accessToken: string;

  @IsString()
  @ApiProperty({
    description: 'refresh 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVt...',
  })
  refreshToken: string;

  @IsString()
  @ApiProperty({
    description: '사용자 닉네임',
    example: '닉네임1',
  })
  nickname: string;

  @ApiProperty({
    description: '프로필 이미지 key',
    example: '/profile/1.jpg',
    nullable: true,
  })
  profileImageKey: string | null;

  @ApiProperty({
    description: '사용자 유형',
    example: UserRole.USER,
    nullable: true,
  })
  role: UserRole;
}
