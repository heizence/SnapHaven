import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RequestFileDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(209715200) // 200MB
  size: number;

  @IsNotEmpty()
  @IsString()
  type: string; // MIME 타입
}

// S3 Presigned Url 생성 요청 dto
export class RequestUrlsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestFileDto)
  files: RequestFileDto[];

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsBoolean()
  isAlbumUpload: boolean;
}
