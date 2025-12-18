import { ApiProperty } from '@nestjs/swagger';

export class DeleteCollectionResDto {
  @ApiProperty({ description: '삭제된 컬렉션 고유 ID', example: 7 })
  deletedCollectionId: number;
}
