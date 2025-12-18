import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class EditProfileReq {
  // 현재 비밀번호
  @IsOptional()
  @IsString({ message: '기존 비밀번호는 문자열 형식이어야 합니다.' })
  @ApiProperty({
    description: '현재 비밀번호 (본인 인증용)',
    example: 'currentPassword123!',
    required: true,
  })
  currentPassword?: string;

  // 닉네임 변경 필드
  @IsOptional()
  @IsString({ message: '닉네임은 문자열 형식이어야 합니다.' })
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  @MaxLength(15, { message: '닉네임은 최대 15자 이하여야 합니다.' })
  @ApiProperty({
    description: '새로운 닉네임 (선택 사항)',
    example: 'NewCreativeUser',
    required: false,
    nullable: true,
  })
  newNickname?: string;

  // 비밀번호 변경 필드
  @IsOptional()
  @IsString({ message: '새 비밀번호는 문자열 형식이어야 합니다.' })
  @MinLength(8, { message: '새 비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
    message:
      '새 비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.',
  })
  @ApiProperty({
    description: '새로운 비밀번호 (선택 사항)',
    example: 'newPassword456!',
    required: false,
    nullable: true,
  })
  newPassword?: string;
}
