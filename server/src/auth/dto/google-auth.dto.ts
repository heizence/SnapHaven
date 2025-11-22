import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google 인증 서버에서 받은 accessToken',
    example: 'eyJhbGciOiJIUzI1NiI...',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
