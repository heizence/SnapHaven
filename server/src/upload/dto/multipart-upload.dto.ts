import {
  IsString,
  IsArray,
  IsNumber,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InitiateMultipartUploadReqDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;

  @IsString()
  @IsNotEmpty()
  s3Key: string;
}
export class InitiateMultipartUploadResDto {
  @IsString()
  uploadId: string | undefined;

  @IsString()
  s3Key: string;
}

export class GetPresignedPartsReqDto {
  @IsString()
  @IsNotEmpty()
  uploadId: string;

  @IsString()
  @IsNotEmpty()
  s3Key: string;

  @IsString()
  @IsNotEmpty()
  partNumbers: string; // "1,2,3,4,5" 형태
  //partNumbers: number[];
}
export class EachPresignedPartDto {
  partNumber: number;
  url: string;
}

export class CompleteMultipartUploadReqDto {
  @IsString()
  uploadId: string;

  @IsString()
  s3Key: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartDto)
  parts: PartDto[];
}
export class CompleteMultipartUploadResDto {
  @IsString()
  fileName: string;

  @IsString()
  contentType: string;
}

export class PartDto {
  @IsNumber()
  PartNumber: number;

  @IsString()
  ETag: string;
}
