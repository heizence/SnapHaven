import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class ProfileInfoDto {
  @ApiProperty({ description: '사용자 고유 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '닉네임', example: 'CreativeUser' })
  nickname: string;

  @ApiProperty({
    description: '프로필 이미지 URL',
    example: 'https://cdn.snaphaven.com/profile/1.jpg',
    nullable: true,
  })
  profileImageUrl: string | null;

  @ApiProperty({ description: '업로드한 총 미디어 항목 개수', example: 42 })
  mediaItemCount: number; // 통계 데이터 포함

  constructor(user: User, mediaItemCount: number) {
    this.id = user.id;
    this.nickname = user.nickname;
    this.profileImageUrl = user.profileImageUrl;
    this.mediaItemCount = mediaItemCount;
  }
}
