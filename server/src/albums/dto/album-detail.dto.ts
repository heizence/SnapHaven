import { ApiProperty } from '@nestjs/swagger';
import { ContentType } from 'src/common/enums';

// 앨범 내 개별 미디어 아이템 DTO
export class AlbumMediaItemDto {
  @ApiProperty({ description: '미디어 고유 ID', example: 1240 })
  id: number;

  @ApiProperty({ description: '콘텐츠 유형', example: ContentType.IMAGE })
  type: ContentType.IMAGE; // 앨범은 이미지로만 구성

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
}

// 앨범 상세 정보 응답 DTO
export class GetAlbumDetailResDto {
  @ApiProperty({ description: '앨범 고유 ID', example: 101 })
  id: number;

  @ApiProperty({ description: '앨범 제목', example: '파리 여행 모음' })
  title: string;

  @ApiProperty({
    description: '앨범 설명',
    example: '2025년 여름 파리에서 찍은 모든 사진.',
  })
  description: string | null;

  @ApiProperty({
    description: '콘텐츠를 업로드한 사용자의 닉네임',
    example: 'PhotoMaster',
  })
  ownerNickname: string;

  @ApiProperty({
    description: '앨범을 업로드한 사용자의 프로필 이미지 키',
    example: 'profiles/a1234567-1a2b-12cd-a123-a1bc12345678.jpeg',
    nullable: true,
  })
  ownerProfileImageKey: string | null;

  @ApiProperty({
    description: '앨범 생성 날짜 (ISO 8601)',
    example: '2025-11-20T10:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    type: [String],
    description: '앨범에 등록된 태그 목록',
    example: ['여행', '파리', '유럽'],
  })
  tags: string[];

  @ApiProperty({
    description: '현재 로그인한 사용자가 이 콘텐츠에 좋아요를 눌렀는지 여부', // 인증된 사용자에게만 필요
    example: false,
  })
  isLikedByCurrentUser: boolean;

  @ApiProperty({
    description: '앨범 대표(커버) 콘텐츠 id(추후 앨범 컬렉션 추가 기능에 사용)',
    example: 1234,
  })
  representativeItemId: number;

  @ApiProperty({
    type: [AlbumMediaItemDto],
    description: '앨범에 포함된 미디어 아이템 목록',
  })
  items: AlbumMediaItemDto[];
}
