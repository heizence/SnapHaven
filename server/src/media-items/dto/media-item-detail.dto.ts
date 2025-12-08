import { ApiProperty } from '@nestjs/swagger';

export class MediaItemDetailDto {
  @ApiProperty({ description: '미디어 고유 ID', example: 1494 })
  id: number;

  @ApiProperty({ description: '미디어 제목', example: '파리 에펠탑의 새벽' })
  title: string;

  @ApiProperty({
    description: '상세 설명',
    example: '2025년 5월에 촬영된 에펠탑 사진입니다.',
  })
  description: string | null;

  @ApiProperty({ description: '콘텐츠 유형', example: 'IMAGE' })
  type: 'IMAGE' | 'VIDEO';

  @ApiProperty({ description: '미디어 가로 길이', example: 1920 })
  width: number;

  @ApiProperty({ description: '미디어 세로 길이', example: 1080 })
  height: number;

  @ApiProperty({
    description: '이미지(large) key',
    example: 'media-items/1234_1234567890123/large.jpg',
  })
  keyImageLarge: string | null;

  @ApiProperty({
    description: '이미지(medium) key',
    example: 'media-items/1234_1234567890123/medium.jpg',
  })
  keyImageMedium: string | null;

  @ApiProperty({
    description: '이미지(small) key',
    example: 'media-items/1234_1234567890123/small.jpg',
  })
  keyImageSmall: string;

  @ApiProperty({
    description: '비디오 playback 키 (MP4)',
    example: 'media-items/1234_1234567890123/playback.mp4',
    nullable: true,
  })
  keyVideoPlayback: string | null;

  // 통계 및 사용자 정보
  @ApiProperty({ description: '좋아요 개수', example: 89 })
  likeCount: number;

  @ApiProperty({ description: '다운로드 횟수', example: 12 })
  downloadCount: number;

  @ApiProperty({ description: '업로드 사용자 닉네임', example: 'PhotoMaster' })
  ownerNickname: string;

  @ApiProperty({
    description: '업로드 사용자 프로필 이미지 키',
    example: 'profiles/a1234567-1a2b-12cd-a123-a1bc12345678.jpeg',
  })
  ownerProfileImageKey: string;

  @ApiProperty({
    description: '미디어 생성 일시',
    example: '2025-01-01 18:48:51',
  })
  createdAt: string;

  // Tags
  @ApiProperty({
    description: '관련 태그 목록',
    example: ['여행', '파리', '새벽'],
  })
  tags: string[];

  // User Status (인증된 사용자에게만 필요)
  @ApiProperty({
    description: '현재 로그인한 사용자가 이 콘텐츠에 좋아요를 눌렀는지 여부',
    example: false,
  })
  isLikedByCurrentUser: boolean;
}
