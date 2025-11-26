import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsBooleanString,
} from 'class-validator';

export class UploadContentDto {
  @ApiProperty({
    example: '오늘 찍은 풍경',
    description: '제목 (최대 30자)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  title: string;

  @ApiProperty({
    example: '오늘 아침 해변에서 찍은 노을 사진입니다.',
    description: '미디어 상세 설명 (최대 500자)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: '풍경,도시,여행',
    description: '태그 목록 (쉼표 구분 문자열)',
    required: false,
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiProperty({
    example: 'true',
    description: '여러 파일 업로드 시 앨범(묶음)으로 처리할지 여부',
    type: 'string', // Multer/form-data는 불리언을 문자열로 전송한다
  })
  @IsBooleanString() // 문자열 "true" 또는 "false"
  isAlbumUpload: string;
}
