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
  user: User;
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

export interface UploadFileRequest {
  files: any;
}

export interface GetMediaItemsRequest {
  page?: number; // starts with 1
  sort?: OrderType;
  keyword?: string;
  type?: FilterType;
}

export interface GetEachContentRequest {
  id: string;
}

export interface GetCollectionRequest {
  id: string;
  page: number; // starts with 1
}

export interface GetContentsResponse {
  data: Array<EachContentObj>;
}

export interface EachContentObj {
  id: string;
  name: string;
  type: string;
  isInList: boolean;
  listId: string;
  fileUrl: string;
  fileKey: string;
}

export interface SendMailRequest {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html: string;
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
export interface User {
  id: number;
  email: string;
  password: string;
  profileImgUrl?: string;
  s3fileKey?: string;
}

export interface ResetPasswordRecord {
  userId: number;
  email: string;
  token: string;
  expiresAt: string;
  plainPassword: string;
}

export interface ProfileInfo {
  nickname: string;
  profileImageUrl?: string;
}

export interface EachContent {
  id: string | number;
  name: string;
  src: string;
  type: string;
  isInList: number;
  listId: string;
  width: number;
  height: number;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

// S3 Presigned URL 발급 요청
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
