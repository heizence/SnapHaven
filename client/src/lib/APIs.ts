import axios from "axios";

import {
  CheckNicknameRequest,
  CheckNicknameResponse,
  GetProfileInfoRequest,
  GetProfileInfoResponse,
  ResetPasswordRequest,
  SignInRequest,
  SignInResponse,
  SignUpRequest,
  SignUpResponse,
  GetContentsRequest,
  CheckResetPwInfoRequest,
  DeleteUserRequest,
  GetEachContentRequest,
  GetCollectionRequest,
  forgotPasswordRequest,
  GoogleAuthRequest,
  GetTagsResponse,
  GetMediaPresignedUrlRequest,
  RefreshTokenResponse,
  EditProfileInfoRequest,
} from "./interfaces";
import { ResponseDto } from "./ResponseDto";
import { cloneDeep } from "lodash";

/** 기본적인 API 요청 method 형식
 * 응답값(성공, 실패)을 return 하도록 되어 있음. await 를 이용하여 값을 받으면 됨.
 * 콜백 함수를 넘겨줘서 응답 수신 후 콜백 함수를 실행하게 할 수도 있음.
 */
const axiosInstance = axios.create({ withCredentials: true });

const cloneFormData = (formData: FormData) => {
  const newFormData = new FormData();
  formData.forEach((value, key) => {
    newFormData.append(key, value as any);
  });
  return newFormData;
};

const retryRequest = (error) => {
  console.log("\n[retryRequest]");
  const originalConfig = error.config;
  if (!originalConfig || originalConfig.__isRetryRequest) return Promise.reject(error);

  originalConfig.__isRetryRequest = true;

  if (originalConfig.data instanceof FormData) {
    originalConfig.data = cloneFormData(originalConfig.data);
  } else if (originalConfig.data) {
    originalConfig.data = cloneDeep(originalConfig.data);
  }
  return axiosInstance.request(originalConfig);

  // if (error.config && !error.config.__isRetryRequest) {
  //   error.config.__isRetryRequest = true;
  //   return axiosInstance.request(error.config);
  // }
  // return Promise.reject(error);
};

const interceptorErrorHandler = async (error) => {
  // 토큰 재발급
  if (error.status === 401) {
    console.log("axios interceptors 401 error : ", error);
    console.log("path : ", error.request.responseURL || "");
    const res: ResponseDto<RefreshTokenResponse> = await refreshToken();
    console.log("refresh token res : ", res);
    if (res.code === 200) {
      return retryRequest(error);
    }
  }
  return Promise.reject(error);
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => interceptorErrorHandler(error)
);

const commonAPI = async <TRequest, TResponse>(
  method: string = "POST",
  path: string,
  reqParamsOrBody: TRequest
): Promise<ResponseDto<TResponse>> => {
  return axiosInstance({
    baseURL: "/api",
    url: path,
    method,
    headers: {
      Accept: "application/json",
    },
    //data: method !== "GET" ? reqParamsOrBody : undefined,
    //params: method === "GET" ? reqParamsOrBody : undefined,
    data: reqParamsOrBody,
    params: method === "GET" ? reqParamsOrBody : undefined,
    timeout: 40000,
  })
    .then((response) => {
      return response?.data;
    })
    .catch((error) => {
      console.error("[commomAPI]error : ", error);
      throw error.response?.data || error;
    });
};

/** 데이터(이미지, 비디오 등) 전송 API 요청 method 형식
 * 응답값(성공, 실패)을 return 하도록 되어 있음. await 를 이용하여 값을 받으면 됨.
 * 콜백 함수를 넘겨줘서 응답 수신 후 콜백 함수를 실행하게 할 수도 있음.
 */
const commonMultipartAPI = async <TRequest, TResponse>(
  path: string,
  formData: TRequest
): Promise<ResponseDto<TResponse>> => {
  return axiosInstance({
    baseURL: "/api",
    url: path,
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data",
    },
    data: formData,
    timeout: 40000,
  })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error(`[commonMultipartAPI] [${path}]error : `, error);
      throw error.response?.data || error;
    });
};

const getRequest = <TRequest, TResponse>(path: string, reqParamsOrBody: TRequest) =>
  commonAPI<TRequest, TResponse>("GET", path, reqParamsOrBody);

const postRequest = <TRequest, TResponse>(path: string, reqParamsOrBody: TRequest) =>
  commonAPI<TRequest, TResponse>("POST", path, reqParamsOrBody);

const patchRequest = <TRequest, TResponse>(path: string, reqParamsOrBody: TRequest) =>
  commonAPI<TRequest, TResponse>("PATCH", path, reqParamsOrBody);

const multipartRequest = <TRequest, TResponse>(path: string, formData: TRequest) =>
  commonMultipartAPI<TRequest, TResponse>(path, formData);

/******************* API List ******************/
// 로그인
export const signinAPI = (requestBody: SignInRequest) =>
  postRequest<SignInRequest, SignInResponse>("auth/signin", requestBody);

// 구글 로그인(회원가입)
export const googleAuthAPI = (requestBody: GoogleAuthRequest) =>
  postRequest<GoogleAuthRequest, SignInResponse>("auth/google", requestBody);

// 로그아웃
export const signoutAPI = () => postRequest<null, null>("auth/signout", null);

// 닉네임 중복체크
export const checkNicknameAPI = (requestBody: CheckNicknameRequest) =>
  getRequest<CheckNicknameRequest, CheckNicknameResponse>("auth/check-nickname", requestBody);

// 회원가입
export const signupAPI = (requestBody: SignUpRequest) =>
  postRequest<SignUpRequest, SignUpResponse>("auth/signup", requestBody);

// 프로필 정보 불러오기
export const getProfileInfoAPI = () =>
  getRequest<null, GetProfileInfoResponse>("users/me/profile", null);

export const getUserContentsAPI = (requestBody: GetProfileInfoRequest) =>
  getRequest<GetProfileInfoRequest, GetProfileInfoResponse>("getProfileInfo", requestBody);

// 비밀번호 재설정 링크를 메일로 전송하는 api
export const forgotPasswordAPI = (requestBody: forgotPasswordRequest) =>
  postRequest<forgotPasswordRequest, null>("auth/forgot-password", requestBody);

// 실제로 비밀번호 재설정하는 api
export const resetPasswordAPI = (requestBody: ResetPasswordRequest) =>
  postRequest<ResetPasswordRequest, null>("auth/reset-password", requestBody);

// 태그 목록 불러오기
export const getTagsAPI = () => getRequest<null, GetTagsResponse>("tags", null);

// 업로드할 파일 S3 Presigned URL 발급 요청
export const getMediaPresignedUrlsAPI = (requestBody: GetMediaPresignedUrlRequest) =>
  postRequest<GetMediaPresignedUrlRequest, null>("upload/request-urls", requestBody);

// S3 key 생성 후 파일 처리 요청
export const requestFileUploadAPI = (body: { s3Keys: string[]; albumId?: number }) =>
  postRequest<
    {
      s3Keys: string[];
      albumId?: number;
    },
    {
      message: string;
    }
  >("upload/request-processing", body);

export const getContentsAPI = (requestBody: GetContentsRequest) =>
  getRequest<GetContentsRequest, null>("getContents", requestBody);

export const GetEachContentAPI = (requestBody: GetEachContentRequest) =>
  getRequest<GetEachContentRequest, null>("getEachContent", requestBody);

export const GetCollectionAPI = (requestBody: GetCollectionRequest) =>
  getRequest<GetCollectionRequest, null>("getCollection", requestBody);

export const checkResetPasswordInfoAPI = (requestBody: CheckResetPwInfoRequest) =>
  postRequest<CheckResetPwInfoRequest, null>("checkResetPasswordInfo", requestBody);

// 프로필 닉네임, 비밀번호 변경
export const editProfileInfoAPI = (requestBody: EditProfileInfoRequest) =>
  patchRequest<EditProfileInfoRequest, null>("users/me/profile", requestBody);

// 프로필 이미지 수정
export const editProfileImageAPI = (requestBody: FormData) =>
  multipartRequest<FormData, null>("users/me/profile-image", requestBody);

export const deleteUserAPI = (requestBody: DeleteUserRequest) =>
  postRequest<DeleteUserRequest, null>("users/me/delete", requestBody);

export const refreshToken = () => postRequest<null, RefreshTokenResponse>("auth/refresh", null);
