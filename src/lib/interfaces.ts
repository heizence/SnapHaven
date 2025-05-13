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

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordResponse {
  token: string;
}

export interface UploadFileRequest {
  files: any;
}

export interface CommonResDto<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

export interface SendMailRequest {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html: string;
}

export interface checkResetPwInfoRequest {
  email: string;
  token: string;
}

export interface User {
  id: number;
  email: string;
  password: string;
}

export interface ResetPasswordRecord {
  userId: number;
  email: string;
  token: string;
  expiresAt: string;
  plainPassword: string;
}
