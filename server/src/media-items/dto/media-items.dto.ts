import { ApiProperty } from '@nestjs/swagger';

export class MediaItemDto {
  @ApiProperty({ description: '미디어 고유 ID', example: 123 })
  id: number;

  @ApiProperty({ description: '미디어 제목', example: '노을 지는 해변' })
  title: string;

  @ApiProperty({ description: '콘텐츠 유형', example: 'IMAGE' })
  type: 'IMAGE' | 'VIDEO';

  @ApiProperty({ description: '앨범 id', example: 1234 })
  albumId: number | null;

  @ApiProperty({ description: '미디어 가로 길이', example: 1920 })
  width: number;

  @ApiProperty({ description: '미디어 세로 길이', example: 1080 })
  height: number;

  @ApiProperty({
    description: '썸네일 이미지(small) key',
    example: 'media-items/1234_1234567890123/small.jpg',
  })
  keyImageSmall: string;

  @ApiProperty({
    description: '이미지(medium) key',
    example: 'media-items/1234_1234567890123/medium.jpg',
  })
  keyImageMedium: string | null;

  @ApiProperty({
    description: '이미지(large) key',
    example: 'media-items/1234_1234567890123/large.jpg',
  })
  keyImageLarge: string | null;

  @ApiProperty({
    description: '비디오 미리보기 클립(type 이 IMAGE 일 경우에는 null)',
    example: 'preview/123.mp4',
    nullable: true,
  })
  keyVideoPreview: string | null;

  @ApiProperty({
    description: '현재 사용자가 해당 아이템에 좋아요 표시 여부',
    example: '1',
    nullable: true,
  })
  isLikedByCurrentUser: boolean;
}
