import { ApiProperty } from '@nestjs/swagger';

export class GetDownloadUrlDto {
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
