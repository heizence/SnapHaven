import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

// 컬렉션 목록 조회 응답 DTO
export class CollectionListResponseDto {
  @ApiProperty({ description: '컬렉션 ID', example: 1 })
  id: number;

  @ApiProperty({ description: '컬렉션 이름', example: '여행 기록' })
  name: string;

  @ApiProperty({ description: '컬렉션에 포함된 아이템 개수', example: 25 })
  itemCount: number;

  @ApiProperty({
    description: '컬렉션 썸네일 키 (첫 번째 아이템의 small 키)',
    example: 'media-items/123_thumb/small.jpg',
    nullable: true,
  })
  thumbnailKey: string | null;

  @IsOptional()
  @ApiProperty({
    description: '특정 콘텐츠가 각 컬렉션에 포함되어 있는지 여부',
    example: true,
  })
  isContentContained: boolean;
}
