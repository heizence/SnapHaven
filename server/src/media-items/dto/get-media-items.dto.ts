import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ContentType } from 'src/common/enums';
import { MediaItemDto } from './media-items.dto';

export enum MediaSort {
  LATEST = 'LATEST',
  POPULAR = 'POPULAR',
}

export class GetMediaItemsReqDto {
  @ApiProperty({ description: '요청 페이지 번호', default: 1, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiProperty({
    description: '정렬 기준',
    enum: MediaSort,
    default: MediaSort.LATEST,
    required: false,
  })
  @IsEnum(MediaSort)
  @IsOptional()
  sort: MediaSort = MediaSort.LATEST;

  @ApiProperty({
    description: '필터링할 콘텐츠 유형',
    enum: ['ALL', ContentType.IMAGE, ContentType.VIDEO],
    default: 'ALL',
    required: false,
  })
  @IsString()
  @IsOptional()
  type: 'ALL' | ContentType.IMAGE | ContentType.VIDEO = 'ALL';

  @ApiProperty({
    description: '검색 키워드',
    default: '',
    required: false,
  })
  @IsString()
  @IsOptional()
  keyword: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  lastId?: string; // 마지막으로 본 아이템의 ID

  @IsOptional()
  lastValue?: string | number; // 정렬 기준이 '인기순'일 경우 마지막으로 본 좋아요 수
}

export class GetMediaItemsResDto {
  @ApiProperty({ type: [MediaItemDto] })
  items: MediaItemDto[];

  @ApiProperty({ description: '총 항목 수', example: 100 })
  @IsOptional()
  totalCounts?: number;
}
