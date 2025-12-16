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
  GetMediaItemsRequest,
  DeleteUserRequest,
  forgotPasswordRequest,
  GoogleAuthRequest,
  GetTagsResponse,
  GetMediaPresignedUrlRequest,
  RefreshTokenResponse,
  EditProfileInfoRequest,
  GetSingleItemRequest,
  UploadFileRequest,
  GetDownloadUrlRequest,
  ToggleContentsRequest,
  CreateCollectionRequest,
  EditCollectionRequest,
  GetCollectionContents,
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

const deleteRequest = <TRequest, TResponse>(path: string, reqParamsOrBody: TRequest) =>
  commonAPI<TRequest, TResponse>("DELETE", path, reqParamsOrBody);

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
export const requestFileUploadAPI = (body: UploadFileRequest) =>
  postRequest<
    UploadFileRequest,
    {
      message: string;
    }
  >("upload/request-processing", body);

// 미디어 콘텐츠 목록 불러오기
export const getMediaItemsAPI = (requestBody: GetMediaItemsRequest) =>
  getRequest<GetMediaItemsRequest, null>("media/items", requestBody);

// 단일 미디어 콘텐츠 불러오기
export const getSingleMediaItemAPI = (requestBody: GetSingleItemRequest) =>
  getRequest<GetSingleItemRequest, null>(`media/item/${requestBody.id}`, requestBody);

// 앨범 상세 데이터 불러오기
export const getAlbumDetailAPI = (requestBody: GetSingleItemRequest) =>
  getRequest<GetSingleItemRequest, null>(`media/album/${requestBody.id}`, requestBody);

// 앨범 다운로드 요청
export const requestAlbumDownloadAPI = (albumId: number) =>
  postRequest<{ albumId: number }, null>(`media/album/download/${albumId}`, { albumId });

// 아이템 좋아요/좋아요 취소 처리
export const toggleLikedItemAPI = (mediaId: number) =>
  postRequest<{ mediaId: number }, null>(`media/item/like/${mediaId}`, { mediaId });

// 내 컬렉션 목록 조회
// mediaId 값을 넣어주면 해당 media-item 이 어떤 컬렉션에 포함되어 있는지 조회할 수 있음.
export const getMyCollectionListAPI = (requestBody?: { mediaId: number }) =>
  getRequest<{ mediaId: number } | undefined, null>("collections", requestBody ?? undefined);

// 내가 업로드한 콘텐츠 목록 조회
export const getMyUploadsAPI = (requestBody: { page: number }) =>
  getRequest<{ page: number }, null>("users/uploads", requestBody);

// 내가 좋아요 표시한 콘텐츠 목록 조회
export const getMyLikedContentsAPI = (requestBody: { page: number }) =>
  getRequest<{ page: number }, null>("users/likes", requestBody);

// 특정 컬렉션 내의 콘텐츠 내용 조회
export const getCollectionContentsAPI = (requestBody: GetCollectionContents) =>
  getRequest<GetCollectionContents, null>("collections/contents", requestBody);

// 새 컬렉션 생성
export const createNewCollectionAPI = (requestBody: CreateCollectionRequest) =>
  postRequest<CreateCollectionRequest, null>("collections/create", requestBody);

// 컬렉션 수정
export const updateCollectionAPI = (requestBody: EditCollectionRequest) =>
  patchRequest<{ name: string }, null>(`collections/${requestBody.collectionId}`, {
    name: requestBody.name, // 400 validation 에러 방지를 위해 이름만 따로 전송
  });

// 컬렉션 삭제
export const deleteCollectionAPI = (collectionId: number) =>
  deleteRequest<null, null>(`collections/${collectionId}`, null);

// 컬렉션에 미디어 아이템 추가/제거
export const toggleMediaItemAPI = (requestBody: ToggleContentsRequest) =>
  postRequest<null, null>(
    `collections/${requestBody.collectionId}/media/${requestBody.mediaId}`,
    null
  );

// 컬렉션에 앨범 추가/제거
export const toggleAlbumItemAPI = (requestBody: ToggleContentsRequest) =>
  postRequest<null, null>(
    `collections/${requestBody.collectionId}/album/${requestBody.albumId}`,
    null
  );

// 프로필 닉네임, 비밀번호 변경
export const editProfileInfoAPI = (requestBody: EditProfileInfoRequest) =>
  patchRequest<EditProfileInfoRequest, null>("users/me/profile", requestBody);

// 프로필 이미지 수정
export const editProfileImageAPI = (requestBody: FormData) =>
  multipartRequest<FormData, null>("users/me/profile-image", requestBody);

// 사용자 계정 삭제(회원 탈퇴)
export const deleteUserAPI = (requestBody: DeleteUserRequest) =>
  postRequest<DeleteUserRequest, null>("users/me/delete", requestBody);

export const refreshToken = () => postRequest<null, RefreshTokenResponse>("auth/refresh", null);

// 콘텐츠 다운로드 url 요청
export const getDownloadUrlAPI = (requestBody: GetDownloadUrlRequest) =>
  getRequest<GetDownloadUrlRequest, null>(`media/download`, requestBody);
