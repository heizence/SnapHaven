import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

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
    description: '컬렉션 생성 후 추가할 콘텐츠(아이템, 앨범) id 값',
    example: 1234,
  })
  @IsOptional()
  contentId: number;

  @ApiProperty({
    description:
      '컬렉션 생성 후 추가할 콘텐츠(아이템, 앨범)의 유형(ALBLUM, ITEM)',
    example: 'ALBUM',
  })
  @IsOptional()
  contentType: 'ALBUM' | 'ITEM';
}
