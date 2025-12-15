import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, MaxLength, IsNumber } from 'class-validator';

export class CreateCollectionDto {
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
  mediaId: number;
}
