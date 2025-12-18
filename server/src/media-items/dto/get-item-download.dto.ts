import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetItemDownloadUrlReqDto {
  @ApiProperty({
    description: '다운로드할 이미지 또는 영상 파일의 S3 Key',
    example: 'media-items/1234.../1.jpg',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  s3Key: string;
}
export class GetItemDownloadUrlResDto {
  @ApiProperty({
    example: 'https://s3.amazonaws.com/presigned-url?AWSAccessKeyId=...',
    description: '만료 시간이 설정된 다운로드 URL',
  })
  downloadUrl: string;

  @ApiProperty({
    example: '파리_에펠탑.jpg',
    description: '다운로드 시 클라이언트에게 제공할 파일 이름',
  })
  fileName: string;
}
