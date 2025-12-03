import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SigninResponseDto {
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
}
