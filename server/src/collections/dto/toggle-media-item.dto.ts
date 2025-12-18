import { ApiProperty } from '@nestjs/swagger';

export class ToggleMediaItemResDto {
  @ApiProperty({
    description: '컬렉션에 콘텐츠가 추가됨(true)/제거됨(false) 여부. ',
    example: true,
  })
  isAdded: boolean;
}
