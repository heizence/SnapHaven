import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateCollectionDto {
  @ApiProperty({
    description: '새로 적용할 컬렉션 이름 (최대 30자)',
    example: 'My Favorites',
  })
  @IsString()
  @IsNotEmpty({ message: '컬렉션 이름은 필수입니다.' })
  @MaxLength(30, { message: '컬렉션 이름은 최대 30자입니다.' })
  name: string;
}
