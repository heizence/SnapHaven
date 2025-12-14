import { ApiProperty } from '@nestjs/swagger';

export class CollectionResponseDto {
  @ApiProperty({ description: '컬렉션 고유 ID', example: 7 })
  id: number;

  @ApiProperty({ description: '컬렉션 이름', example: 'My Favorites' })
  name: string;

  @ApiProperty({ description: '총 미디어 아이템 수', example: 15 })
  itemCount: number;

  @ApiProperty({ description: '컬렉션 소유자 ID', example: 123 })
  userId: number;
}
