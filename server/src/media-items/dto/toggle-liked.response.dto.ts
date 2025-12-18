import { ApiProperty } from '@nestjs/swagger';

export class ToogleLikedResDto {
  @ApiProperty({ description: '좋아요 표시 성공 여부', example: true })
  isLiked: boolean;
}
