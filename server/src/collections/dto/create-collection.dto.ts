import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateCollectionReqDto {
  @ApiProperty({
    description: '생성할 컬렉션 이름 (최대 30자)',
    example: 'My Favorites',
  })
  @IsString()
  @IsNotEmpty({ message: '컬렉션 이름은 필수입니다.' })
  @MaxLength(30, { message: '컬렉션 이름은 최대 30자입니다.' })
  name: string;

  @ApiProperty({
    description: '컬렉션 생성 후 추가할 아이템 id 값',
    example: 1234,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  mediaId: number;
}

export class CreateCollectionResDto {
  @ApiProperty({ description: '컬렉션 고유 ID', example: 7 })
  id: number;

  @ApiProperty({ description: '컬렉션 이름', example: 'My Favorites' })
  name: string;

  @ApiProperty({ description: '총 미디어 아이템 수', example: 15 })
  itemCount: number;

  @ApiProperty({ description: '컬렉션 소유자 ID', example: 123 })
  userId: number;
}
