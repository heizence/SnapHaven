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

export interface UploadFileRequest {
  files: any;
}

export interface UploadFileResponse {
  files: any;
}

export interface CommonResDto<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

export interface User {
  id: number;
  email: string;
  password: string;
}
