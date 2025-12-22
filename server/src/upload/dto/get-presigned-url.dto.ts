import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RequestFileDto {
  @ApiProperty({ example: 'vacation.jpg', description: '파일 이름' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 5242880,
    description: '파일 크기 (bytes)',
    minimum: 1,
    maximum: 209715200,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(209715200) // 200MB
  size: number;

  @ApiProperty({ example: 'image/jpeg', description: '파일 유형' })
  @IsNotEmpty()
  @IsString()
  type: string; // MIME 타입

  @ApiProperty({ example: 1920, description: '파일 너비' })
  @IsNotEmpty()
  @IsNumber()
  width: number;

  @ApiProperty({ example: 1080, description: '파일 높이' })
  @IsNotEmpty()
  @IsNumber()
  height: number;
}

// S3 Presigned Url 생성 요청 dto
export class GetMediaPresignedUrlReqDto {
  @ApiProperty({
    type: () => RequestFileDto, // 중첩된 클래스 지정
    isArray: true, // 배열임을 명시
    description: '업로드할 파일들의 메타데이터 배열',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestFileDto)
  files: RequestFileDto[];

  @ApiProperty({ example: '제주도 여행' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: '2025년 여름 휴가 사진들', required: false })
  @IsString()
  description: string;

  @ApiProperty({ example: ['여행', '바다'], isArray: true })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ example: true, description: '앨범 생성 여부' })
  @IsBoolean()
  isAlbumUpload: boolean;
}

export class PresignedUrlInfo {
  fileIndex: number;
  signedUrl: string;
  s3Key: string;
}
export class GetMediaPresignedUrlResDto {
  @IsArray()
  @ValidateNested({ each: true })
  urls: PresignedUrlInfo[];

  @IsOptional()
  albumId?: number;
}
