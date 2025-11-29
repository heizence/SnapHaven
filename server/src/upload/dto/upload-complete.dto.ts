import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class UploadCompleteDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  s3Keys: string[]; // 업로드 완료된 S3 키 목록

  @IsNumber()
  @IsOptional()
  albumId?: number; // 앨범 업로드 시 사용
}
