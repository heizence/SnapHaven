import { ApiProperty } from '@nestjs/swagger';

type EachProfileContent = {
  count: number;
  thumbnail: string | null;
};
export class GetProfileInfoResDto {
  @ApiProperty({ description: '닉네임', example: 'CreativeUser' })
  nickname: string;

  @ApiProperty({ description: '가입 유형', example: 'Email | GOOGLE' })
  authProvider: string;

  @ApiProperty({
    description: '프로필 이미지 key',
    example: 'profile/1.jpg',
    nullable: true,
  })
  profileImageKey: string | null;

  @ApiProperty({ description: '사용자가 업로드한 콘텐츠 ' })
  uploads: EachProfileContent;

  @ApiProperty({ description: '사용자가 좋아요 표시한 콘텐츠 ' })
  likes: EachProfileContent;

  @ApiProperty({ description: '사용자가 생성한 컬렉션 ' })
  collections: EachProfileContent;
}
