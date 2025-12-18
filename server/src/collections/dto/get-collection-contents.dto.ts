import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { MediaItemDto } from 'src/media-items/dto/media-items.dto';

export class GetCollectionContentsReqDto {
  @ApiProperty({
    description: '컬렉션 id',
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  collectionId: number;

  @ApiProperty({ description: '요청 페이지 번호', default: 1, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page: number = 1;
}

export class GetCollectionContentsResDto {
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
    type: [MediaItemDto],
    description: '컬렉션에 포함된 미디어 아이템 목록',
  })
  items: MediaItemDto[];
}
