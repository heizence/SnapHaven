import { FilterType, OrderType } from "./consts";

/******************* Request & Response Objects ******************/
export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  token: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface SignUpResponse {
  user: any;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface GoogleAuthRequest {
  accessToken: string;
}

export interface CheckNicknameRequest {
  nickname: string;
}

export interface CheckNicknameResponse {
  token: string;
}

export interface GetProfileInfoResponse {
  nickname: string;
  profileImageKey: string;
  authProvider: "EMAIL" | "GOOGLE" | "APPLE";
}

export interface GetProfileInfoRequest {
  token: string;
}

export interface forgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordResponse {
  token: string;
}

export interface Tag {
  id: number;
  name: string;
}
export interface GetTagsResponse {
  tags: Tag[];
}

// S3 key 생성 후 파일 처리 요청
export interface UploadFileRequest {
  s3Keys: string[];
  albumId?: number;
}

export interface GetMediaItemsRequest {
  page?: number; // starts with 1
  sort?: OrderType;
  keyword?: string;
  type?: FilterType;
  tag?: string;
}

// 단일 미디어 아이템 또는 앨범 상세 조회 시 사용
export interface GetSingleItemRequest {
  id: number;
}

export interface GetDownloadUrlRequest {
  s3Key: string;
}

// 내 컬렉션 기본 정보
export interface MyCollection {
  id: number;
  name: string;
  itemCount: number;
  thumbnailKey: string;
  createdAt: string;
}

// 컬렉션 내 컨텐츠 불러오기
export interface GetCollectionContents {
  collectionId: number;
  page?: number;
}

// 컬렉션 생성
export interface CreateCollectionRequest {
  name: string;
  contentId?: number; // 컬렉션 생성 후 바로 추가할 콘텐츠
  contentType?: CollectionContentType;
}

// 컬렉션 생성 후 바로 추가 시 콘텐츠 타입. 기본값 false
export enum CollectionContentType {
  ALBUM = "ALBUM",
  ITEM = "ITEM",
}

// 컬렉션 업데이트
export interface EditCollectionRequest {
  name: string;
  id?: number;
}

// 콘텐츠를 특정 컬렉션에 추가/제거
export interface ToggleContentsRequest {
  collectionId: number;

  // 콘텐츠 종류에 따라 사용
  mediaId?: number;
  albumId?: number;
}

export interface CheckResetPwInfoRequest {
  email: string;
  token: string;
}

export interface EditProfileInfoRequest {
  currentPassword?: string;
  newNickname?: string;
  newPassword?: string;
}

export interface DeleteUserRequest {
  currentPassword: string;
}

export interface ReissueTokenRequest {
  refreshToken: string;
}

export interface CommonResDto<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

/******************* Data ******************/

export interface ProfileInfo {
  nickname: string;
  profileImageUrl?: string;
}

// S3 Presigned URL 발급 요청
interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

export interface GetMediaPresignedUrlRequest {
  files: FileMetadata[];
  title: string;
  description: string;
  tags: string[];
  isAlbumUpload: boolean;
}

/********** Response dto *********/
export interface ResponseDto<T> {
  data: T;
  message: string;
}
