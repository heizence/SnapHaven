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
}

export interface SignUpResponse {
  user: User;
}

export interface CheckEmailRequest {
  email: string;
}

export interface CheckEmailResponse {
  token: string;
}

export interface CheckUsernameRequest {
  username: string;
}

export interface CheckUsernameResponse {
  token: string;
}

export interface GetProfileInfoResponse {
  email: string;
  username: string;
  profileImgUrl: string;
}

export interface GetProfileInfoRequest {
  token: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordResponse {
  token: string;
}

export interface UploadFileRequest {
  files: any;
}

export interface GetContentsRequest {
  type: string;
  page: number; // starts with 1
  keyword?: string;
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

export interface EditProfileRequest {
  username: string;
  email: string;
  profileImg?: File;
}

export interface EditPasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountRequest {
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
  email: string;
  username: string;
  profileImgUrl?: string;
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
