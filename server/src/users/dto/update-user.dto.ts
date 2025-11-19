import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  Matches,
  IsInt,
} from 'class-validator';

export class UpdateUserDto {
  // 변경할 사용자의 새 닉네임
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '닉네임은 2자 이상이어야 합니다.' })
  @MaxLength(20, { message: '닉네임은 20자를 초과할 수 없습니다.' })
  nickname?: string;

  // 변경할 사용자의 새 비밀번호
  @IsOptional()
  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).*$/, {
    message: '비밀번호는 영문자와 숫자를 최소 1개씩 포함해야 합니다.',
  })
  password_hash?: string;

  // 토큰 버전
  @IsOptional()
  @IsInt()
  token_version?: number;

  // 변경할 사용자의 프로필 이미지 URL
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: '유효한 URL 형식이 아닙니다.' })
  profile_image?: string;
}
