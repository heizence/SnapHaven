import { AuthProvider, ContentType, FilterType, OrderType } from "@/constants/enums";

/******************* 인증, 인가 ******************/

// 로그인
export interface SignInReqDto {
  email: string;
  password: string;
}
export interface SignInResDto {
  accessToken: string;
  refreshToken: string;
  nickname: string;
  profileImageKey: string | null;
}

// 구글 로그인(회원가입 포함)
export interface GoogleAuthReqDto {
  accessToken: string;
}

// 토큰 갱신(재발급)
export interface RefreshTokenResDto {
  accessToken: string;
  refreshToken: string;
}

// 회원가입(일반))
export interface SignUpReqDto {
  email: string;
  password: string;
  nickname: string;
}

// 닉네임 중복확인
export interface CheckNicknameReqDto {
  nickname: string;
}

// 비밀번호 재설정 링크 전송 요청
export interface SendResetPWlinkReqDto {
  email: string;
}

// 비밀번호 재설정 요청
export interface ResetPasswordReqDto {
  token: string;
  newPassword: string;
}

/******************* 내 프로필 ******************/

// 프로필 정보 불러오기
type EachProfileContent = {
  count: number;
  thumbnail: string | null;
};

export interface GetProfileInfoResDto {
  nickname: string;
  profileImageKey: string;
  authProvider: AuthProvider;

  uploads: EachProfileContent[];
  likes: EachProfileContent[];
  collections: EachProfileContent[];
}

// 프로필 닉네임, 비밀번호 변경
export interface EditProfileReq {
  currentPassword?: string;
  newNickname?: string;
  newPassword?: string;
}

export interface DeleteUserReqDto {
  currentPassword: string;
}

/******************* 컬렉션 ******************/

// 내 컬렉션 목록 조회(필수 아님)
export interface GetMyCollectionsReqDto {
  mediaId: number;
}

export type Collection = {
  id: number;
  name: string;
  itemCount: number;
  thumbnailKey: string;
  isContentContained?: boolean;
};

// 특정 컬렉션 내의 콘텐츠 내용 조회
export interface GetCollectionContentsReqDto {
  collectionId: number;
  page: number;
}

export interface GetCollectionContentsResDto {
  id: number;
  name: string;
  userId: number;
  totalItems: number;
  items: MediaItem[];
}

// 새 컬렉션 생성
export interface CreateCollectionReqDto {
  name: string;
  mediaId?: number; // 컬렉션 생성 후 바로 추가할 콘텐츠
}

export interface CreateCollectionResDto {
  id: number;
  name: string;
  itemCount: number;
  userId: number;
}

// 컬렉션 수정
export interface EditCollectionReqDto {
  collectionId: number;
  name: string;
}

export interface EditCollectionResDto {
  id: number;
  name: string;
  itemCount: number;
  userId: number;
}

// 컬렉션 삭제
export interface DeleteCollectionResDto {
  deletedCollectionId: number;
}

// 콘텐츠를 특정 컬렉션에 추가/제거
export interface ToggleContentsReqDto {
  collectionId: number;
  mediaId?: number;
}

export interface ToggleMediaItemResDto {
  isAdded: boolean;
}

/******************* 태그 ******************/

export type Tag = {
  id: number;
  name: string;
};

/******************* 콘텐츠(미디어 아이템, 앨범) ******************/

// 각 미디어 아이템 형식
type MediaItemDto = {
  id: number;
  title: string;
  type: ContentType.IMAGE | ContentType.VIDEO;
  albumId: number | null;
  width: number;
  height: number;
  keyImageSmall: string;
  keyImageMedium: string | null;
  keyImageLarge: string | null;
  keyVideoPreview: string | null;
  keyVideoPlayback: string | null;
  isLikedByCurrentUser: boolean;
};

// 미디어 아이템 불러오기(앨범 포함)
export interface GetMediaItemsReqDto {
  page?: number; // starts with 1
  sort?: OrderType;
  type?: FilterType;
  keyword?: string;
  tag?: string;
}

// 미디어 아이템 불러오기 응답(내 업로드, 내 좋아요 조회 시에도 사용)
export interface GetMediaItemsResDto {
  items: MediaItemDto[];
  totalCounts?: number;
}

// 단일 미디어 아이템 상세 조회
export interface GetMediaItemDetailReqDto {
  id: number;
}

export interface GetMediaItemDetailResDto {
  // 아이템 정보
  id: number;
  title: string;
  description: string | null;
  type: ContentType;
  width: number;
  height: number;
  keyImageLarge: string | null;
  keyImageMedium: string | null;
  keyImageSmall: string;
  keyVideoPlayback: string | null;

  // 통계 및 사용자 정보
  likeCount: number;
  downloadCount: number;
  ownerNickname: string;
  ownerProfileImageKey: string | null;
  createdAt: string;
  tags: string[];
  isLikedByCurrentUser: boolean;
}

export type AlbumMediaItemDto = {
  id: number;
  type: ContentType.IMAGE; // 앨범은 이미지로만 구성
  width: number;
  height: number;
  keyImageSmall: string;
  keyImageMedium: string | null;
  keyImageLarge: string | null;
};
// 앨범 상세 조회
export interface GetAlbumDetailReqDto {
  id: number;
}

export interface GetAlbumDetailResDto {
  id: number;
  title: string;
  description: string | null;
  ownerNickname: string;
  ownerProfileImageKey: string | null;
  createdAt: string;
  tags: string[];
  isLikedByCurrentUser: boolean;
  representativeItemId: number;
  items: AlbumMediaItemDto[];
}

// 아이템 좋아요/좋아요 취소 처리
export interface ToogleLikedReqDto {
  mediaId: number;
}

export interface ToogleLikedResDto {
  isLiked: boolean;
}

/******************* 콘텐츠 업로드, 다운로드 ******************/

export interface FileMetadata {
  name: string;
  size: number;
  type: string;

  // ??
  width: number;
  height: number;
}
export interface GetMediaPresignedUrlReqDto {
  files: FileMetadata[];
  title: string;
  description: string;
  tags: string[];
  isAlbumUpload: boolean;
}
export interface PresignedUrlInfo {
  fileIndex: number;
  signedUrl: string;
  s3Key: string;
}
export interface GetMediaPresignedUrlResDto {
  urls: PresignedUrlInfo[];
  albumId?: number;
}

// S3 key 생성 후 파일 처리 요청
export interface requestFileProcessingReqDto {
  s3Keys: string[];
  albumId?: number;
}

// 미디어 아이템 다운로드 url 발급 요청
export interface GetItemDownloadUrlReqDto {
  s3Key: string;
}

export interface GetItemDownloadUrlResDto {
  downloadUrl: string;
  fileName: string;
}

// 앨범 다운로드 요청
export interface requestAlbumDownloadReqDto {
  albumId: number;
}
