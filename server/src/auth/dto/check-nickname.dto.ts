import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CheckNicknameReqDto {
  @ApiProperty({
    example: 'testnickname',
    description: '중복 확인할 닉네임 (2~20자)',
  })
  @IsString()
  @MinLength(2, { message: '닉네임은 2자 이상이어야 합니다.' })
  @MaxLength(20, { message: '닉네임은 20자를 초과할 수 없습니다.' })
  nickname: string;
}
