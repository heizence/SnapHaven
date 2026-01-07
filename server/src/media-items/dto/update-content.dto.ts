import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateContentDto {
  @ApiProperty({
    description: '수정할 콘텐츠의 id(아이템, 앨범 겸용)',
    example: 123,
    required: true,
  })
  @IsNumber()
  contentId: number;

  @ApiProperty({
    description: '수정할 콘텐츠의 새로운 제목',
    example: 'new title',
  })
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: '수정할 콘텐츠의 새로운 내용',
    example: 'new description!',
  })
  @IsOptional()
  description?: string;
}
