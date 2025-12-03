import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DeleteUserDto {
  // 현재 비밀번호
  @IsOptional()
  @IsString({ message: '기존 비밀번호는 문자열 형식이어야 합니다.' })
  @ApiProperty({
    description: '현재 비밀번호 (본인 인증용)',
    example: 'currentPassword123!',
    required: true,
  })
  currentPassword?: string;
}
