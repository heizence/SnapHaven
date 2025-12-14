import { ApiProperty } from '@nestjs/swagger';
import { MediaItemResponseDto } from 'src/media-items/dto/media-item-response.dto';

export class CollectionDetailResponseDto {
  @ApiProperty({ description: '컬렉션 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '컬렉션 이름', example: '여행 기록' })
  name: string;

  @ApiProperty({ description: '컬렉션 소유자 ID', example: 16 })
  userId: number;

  @ApiProperty({
    description: '컬렉션에 포함된 미디어 아이템 총 개수',
    example: 12,
  })
  totalItems: number;

  @ApiProperty({
    type: [MediaItemResponseDto],
    description: '컬렉션에 포함된 미디어 아이템 목록',
  })
  items: MediaItemResponseDto[];
}
