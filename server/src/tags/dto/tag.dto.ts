import { ApiProperty } from '@nestjs/swagger';

export class TagDto {
  @ApiProperty({ example: 1, description: '태그 고유 ID' })
  id: number;

  @ApiProperty({ example: '하늘', description: '태그명' })
  name: string;
}
