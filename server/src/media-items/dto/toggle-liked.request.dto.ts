import { ApiProperty } from '@nestjs/swagger';

export class ToggleLikedRequestDto {
  @ApiProperty({
    description: '콘텐츠가 앨범인지, 단일 아이템인지 판별',
    example: true,
    required: true,
  })
  isAlbum: boolean;

  @ApiProperty({
    description: '앨범 또는 단일 아이템 고유 id',
    example: 1234,
    required: true,
  })
  mediaOrAlbumId: number;
}
