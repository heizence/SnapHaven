import { ApiProperty } from '@nestjs/swagger';

export class MediaItemResponseDto {
  @ApiProperty({ description: '미디어 고유 ID', example: 123 })
  id: number;

  @ApiProperty({ description: '미디어 제목', example: '노을 지는 해변' })
  title: string;

  @ApiProperty({
    description: '썸네일 이미지 key',
    example: 'small/123.jpg',
  })
  keyImageSmall: string | null;

  @ApiProperty({
    description: '비디오 미리보기 클립',
    example: 'preview/123.mp4',
    nullable: true,
  })
  keyVideoPreview: string | null;

  // @ApiProperty({
  //   description: '미디어 업로드 사용자 닉네임',
  //   example: 'CreativeUser',
  // })
  // ownerNickname: string;

  @ApiProperty({ description: '콘텐츠 유형', example: 'IMAGE' })
  type: 'IMAGE' | 'VIDEO';
}

export class PaginatedMediaItemsDto {
  @ApiProperty({ type: [MediaItemResponseDto] })
  items: MediaItemResponseDto[];

  @ApiProperty({ description: '총 항목 수', example: 100 })
  total: number;
}
