import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DownloadRequestDto {
  @ApiProperty({
    description: '다운로드할 이미지 또는 영상 파일의 S3 Key',
    example: 'media-items/1234.../1.jpg',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  s3Key: string;
}
