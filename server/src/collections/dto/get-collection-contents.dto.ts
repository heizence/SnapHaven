import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCollectionContentsDto {
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
