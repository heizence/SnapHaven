import { ApiProperty } from '@nestjs/swagger';

export class ToogleLikedResponseDto {
  @ApiProperty({ description: '좋아요 표시 성공 여부', example: true })
  isLiked: boolean;
}
