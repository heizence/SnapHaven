import axios, { InternalAxiosRequestConfig } from "axios";
import { ResponseDto } from "../types/ResponseDto";
import { cloneDeep } from "lodash";
import {
  CheckNicknameReqDto,
  Collection,
  CreateCollectionReqDto,
  CreateCollectionResDto,
  DeleteCollectionResDto,
  DeleteUserReqDto,
  EditCollectionReqDto,
  EditCollectionResDto,
  EditProfileReq,
  GetCollectionContentsReqDto,
  GetCollectionContentsResDto,
  GetMediaItemsReqDto,
  GetMediaItemsResDto,
  GetMyCollectionsReqDto,
  GetProfileInfoResDto,
  GetMediaItemDetailReqDto,
  GoogleAuthReqDto,
  RefreshTokenResDto,
  ResetPasswordReqDto,
  SendResetPWlinkReqDto,
  SignInReqDto,
  SignInResDto,
  SignUpReqDto,
  Tag,
  ToggleContentsReqDto,
  ToggleMediaItemResDto,
  GetMediaItemDetailResDto,
  GetAlbumDetailReqDto,
  GetAlbumDetailResDto,
  ToogleLikedResDto,
  ToogleLikedReqDto,
  GetMediaPresignedUrlReqDto,
  GetMediaPresignedUrlResDto,
  requestFileProcessingReqDto,
  GetItemDownloadUrlResDto,
  initiateMultipartReqDto,
  getPresignedPartsReqDto,
  completeMultipartReqDto,
  initiateMultipartResDto,
  getPresignedPartsResDto,
  GetAlbumDownloadUrlsResDto,
  VerifyCodeReqDto,
  UpdateContentReqDto,
} from "@/types/api-dtos";

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
  const originalConfig = error.config;
  if (!originalConfig || originalConfig.__isRetryRequest) return Promise.reject(error);

  originalConfig.__isRetryRequest = true;

  if (originalConfig.data instanceof FormData) {
    originalConfig.data = cloneFormData(originalConfig.data);
  } else if (originalConfig.data) {
    originalConfig.data = cloneDeep(originalConfig.data);
  }
  return axiosInstance.request(originalConfig);
};

// Nginx 로 인해 bff 를 통과하지 않는 현상 방지
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = "/api";
  return config;
});

const interceptorErrorHandler = async (error) => {
  // 토큰 재발급
  if (error.status === 401) {
    // console.log("axios interceptors 401 error : ", error);
    // console.log("path : ", error.request.responseURL || "");
    const res: ResponseDto<RefreshTokenResDto> = await refreshToken();
    //console.log("refresh token res : ", res);
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
  reqParamsOrBody: TRequest,
  showErrorAlert: boolean = true
): Promise<ResponseDto<TResponse>> => {
  return axiosInstance({
    url: path,
    method,
    headers: {
      Accept: "application/json",
    },
    data: reqParamsOrBody,
    params: method === "GET" ? reqParamsOrBody : undefined,
    timeout: 40000,
  })
    .then((response) => {
      //console.log("[commomAPI]response.data : ", response?.data);
      return response?.data;
    })
    .catch((error) => {
      console.error(`[commomAPI] [${path}] error : `, error.response?.data);

      // showErrorAlert 옵션이 true 일 떄 alert 로 에러 메시지 표시.
      // 단 500 번대 서버 에러의 경우에는 무조건 alert 표시
      if (showErrorAlert || error.response.code >= 500) {
        alert(error.response?.data.message || "에러가 발생했습니다.");
      }

      return error.response?.data || error;
    });
};

/** 데이터(이미지, 비디오 등) 전송 API 요청 method 형식
 * 응답값(성공, 실패)을 return 하도록 되어 있음. await 를 이용하여 값을 받으면 됨.
 * 콜백 함수를 넘겨줘서 응답 수신 후 콜백 함수를 실행하게 할 수도 있음.
 */
const commonMultipartAPI = async <TRequest, TResponse>(
  path: string,
  formData: TRequest,
  showErrorAlert: boolean = true
): Promise<ResponseDto<TResponse>> => {
  return axiosInstance({
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
      // showErrorAlert 옵션이 true 일 떄 alert 로 에러 메시지 표시.
      // 단 500 번대 서버 에러의 경우에는 무조건 alert 표시
      if (showErrorAlert || error.response.code >= 500) {
        alert(error.response?.data.message || "에러가 발생했습니다.");
      }

      return error.response?.data || error;
    });
};

const getRequest = <TRequest, TResponse>(
  path: string,
  reqParamsOrBody: TRequest,
  showErrorAlert?: boolean
) => commonAPI<TRequest, TResponse>("GET", path, reqParamsOrBody, showErrorAlert);

const postRequest = <TRequest, TResponse>(
  path: string,
  reqParamsOrBody: TRequest,
  showErrorAlert?: boolean
) => commonAPI<TRequest, TResponse>("POST", path, reqParamsOrBody, showErrorAlert);

const patchRequest = <TRequest, TResponse>(
  path: string,
  reqParamsOrBody: TRequest,
  showErrorAlert?: boolean
) => commonAPI<TRequest, TResponse>("PATCH", path, reqParamsOrBody, showErrorAlert);

const deleteRequest = <TRequest, TResponse>(
  path: string,
  reqParamsOrBody: TRequest,
  showErrorAlert?: boolean
) => commonAPI<TRequest, TResponse>("DELETE", path, reqParamsOrBody, showErrorAlert);

const multipartRequest = <TRequest, TResponse>(
  path: string,
  formData: TRequest,
  showErrorAlert?: boolean
) => commonMultipartAPI<TRequest, TResponse>(path, formData, showErrorAlert);

/******************* 인증, 인가 ******************/

// 로그인
export const signinAPI = (requestBody: SignInReqDto) =>
  postRequest<SignInReqDto, SignInResDto>("auth/signin", requestBody);

// 구글 로그인(회원가입)
export const googleAuthAPI = (requestBody: GoogleAuthReqDto) =>
  postRequest<GoogleAuthReqDto, SignInResDto>("auth/google", requestBody, false);

// 토큰 갱신(재발급)
export const refreshToken = () => postRequest<null, RefreshTokenResDto>("auth/refresh", null);

// 로그아웃
export const signoutAPI = () => postRequest<null, null>("auth/signout", null);

// 회원가입
export const signupAPI = (requestBody: SignUpReqDto) =>
  postRequest<SignUpReqDto, null>("auth/signup", requestBody);

// 닉네임 중복확인
export const checkNicknameAPI = (requestBody: CheckNicknameReqDto) =>
  getRequest<CheckNicknameReqDto, null>("auth/check-nickname", requestBody, false);

// 비밀번호 재설정 링크 전송 요청(이메일로 링크를 전송하는 api)
export const sendResetPasswordLinkAPI = (requestBody: SendResetPWlinkReqDto) =>
  postRequest<SendResetPWlinkReqDto, null>("auth/send-reset-pw-link", requestBody);

// 비밀번호 재설정(실제로 비밀번호 재설정하는 api)
export const resetPasswordAPI = (requestBody: ResetPasswordReqDto) =>
  postRequest<ResetPasswordReqDto, null>("auth/reset-password", requestBody);

// 회원가입 할 이메일로 인증번호 전송(인증 요청)
export const requestEmailVerificationAPI = (requestBody: { email: string }) =>
  postRequest<{ email: string }, null>("auth/email-verification/request", requestBody);

// 회원가입 시 인증 코드 검증
export const verifyCodeAPI = (requestBody: VerifyCodeReqDto) =>
  postRequest<VerifyCodeReqDto, null>("auth/email-verification/verify", requestBody);

/******************* 내 프로필 ******************/

// 프로필 정보 불러오기
export const getProfileInfoAPI = () =>
  getRequest<null, GetProfileInfoResDto>("users/me/profile", null);

// 프로필 닉네임, 비밀번호 변경
export const editProfileInfoAPI = (requestBody: EditProfileReq) =>
  patchRequest<EditProfileReq, null>("users/me/profile", requestBody);

// 프로필 이미지 수정
export const editProfileImageAPI = (requestBody: FormData) =>
  multipartRequest<FormData, null>("users/me/profile-image", requestBody);

// 사용자 계정 삭제(회원 탈퇴)
export const deleteUserAPI = (requestBody: DeleteUserReqDto) =>
  postRequest<DeleteUserReqDto, null>("users/me/delete", requestBody);

// 내가 업로드한 콘텐츠 목록 조회
export const getMyUploadsAPI = (requestBody: GetMediaItemsReqDto) =>
  getRequest<GetMediaItemsReqDto, GetMediaItemsResDto>("users/uploads", requestBody);

// 내가 좋아요 표시한 콘텐츠 목록 조회
export const getMyLikedContentsAPI = (requestBody: GetMediaItemsReqDto) =>
  getRequest<GetMediaItemsReqDto, GetMediaItemsResDto>("users/likes", requestBody);

/******************* 컬렉션 ******************/

// 내 컬렉션 목록 조회
// mediaId 값을 넣어주면 해당 media-item 이 어떤 컬렉션에 포함되어 있는지 조회할 수 있음.
export const getMyCollectionsAPI = (requestBody?: GetMyCollectionsReqDto) =>
  getRequest<GetMyCollectionsReqDto | undefined, Collection[]>(
    "collections",
    requestBody ?? undefined
  );

// 특정 컬렉션 내의 콘텐츠 내용 조회
export const getCollectionContentsAPI = (requestBody: GetCollectionContentsReqDto) =>
  getRequest<GetCollectionContentsReqDto, GetCollectionContentsResDto>(
    "collections/contents",
    requestBody
  );

// 새 컬렉션 생성
export const createNewCollectionAPI = (requestBody: CreateCollectionReqDto) =>
  postRequest<CreateCollectionReqDto, CreateCollectionResDto>("collections/create", requestBody);

// 컬렉션 수정
export const editCollectionAPI = (requestBody: EditCollectionReqDto) =>
  patchRequest<{ name: string }, EditCollectionResDto>(`collections/${requestBody.collectionId}`, {
    name: requestBody.name, // 400 validation 에러 방지를 위해 이름만 따로 전송
  });

// 컬렉션 삭제
export const deleteCollectionAPI = (collectionId: number) =>
  deleteRequest<null, DeleteCollectionResDto>(`collections/${collectionId}`, null);

// 컬렉션에 미디어 아이템 추가/제거
export const toggleMediaItemAPI = (requestBody: ToggleContentsReqDto) =>
  postRequest<null, ToggleMediaItemResDto>(
    `collections/${requestBody.collectionId}/media/${requestBody.mediaId}`,
    null
  );

/******************* 태그 ******************/

// 태그 목록 불러오기
export const getTagsAPI = () => getRequest<null, Tag[]>("tags", null);

/******************* 콘텐츠 ******************/

// 미디어 콘텐츠 목록 불러오기
export const getMediaItemsAPI = (requestBody: GetMediaItemsReqDto) =>
  getRequest<GetMediaItemsReqDto, GetMediaItemsResDto>("media/items", requestBody);

// 단일 미디어 콘텐츠 불러오기
export const getMediaItemDetailAPI = (requestBody: GetMediaItemDetailReqDto) =>
  getRequest<GetMediaItemDetailReqDto, GetMediaItemDetailResDto>(
    `media/item/${requestBody.id}`,
    requestBody
  );

// 앨범 상세 데이터 불러오기
export const getAlbumDetailAPI = (requestBody: GetAlbumDetailReqDto) =>
  getRequest<GetAlbumDetailReqDto, GetAlbumDetailResDto>(
    `media/album/${requestBody.id}`,
    requestBody
  );

// 아이템 좋아요/좋아요 취소 처리
export const toggleLikedItemAPI = (requestBody: ToogleLikedReqDto) =>
  postRequest<ToogleLikedReqDto, ToogleLikedResDto>(
    `media/item/like/${requestBody.mediaId}`,
    requestBody
  );

// 미디어 아이템 수정
export const updateMediaItemAPI = (requestBody: UpdateContentReqDto) =>
  postRequest<UpdateContentReqDto, null>(`media/item/update`, requestBody);

// 앨범 수정
export const updateAlbumAPI = (requestBody: UpdateContentReqDto) =>
  postRequest<UpdateContentReqDto, null>(`media/album/update`, requestBody);

// 미디어 아이템 삭제
export const deleteMediaItemAPI = (mediaId: number) =>
  deleteRequest<null, null>(`media/item/${mediaId}`, null);

// 앨범 삭제
export const deleteAlbumAPI = (albumId: number) =>
  deleteRequest<null, null>(`media/album/${albumId}`, null);

/******************* 콘텐츠 업로드, 다운로드 ******************/

// 업로드할 파일 S3 Presigned URL 발급 요청
export const getMediaPresignedUrlsAPI = (requestBody: GetMediaPresignedUrlReqDto) =>
  postRequest<GetMediaPresignedUrlReqDto, GetMediaPresignedUrlResDto>(
    "upload/request-urls",
    requestBody
  );

// S3 key 생성 후 파일 처리 요청
export const requestFileProcessingAPI = (requestBody: requestFileProcessingReqDto) =>
  postRequest<requestFileProcessingReqDto, null>("upload/request-processing", requestBody);

// 영상 multipart 업로드 시작 요청
export const initiateMultipartAPI = (requestBody: initiateMultipartReqDto) =>
  postRequest<initiateMultipartReqDto, initiateMultipartResDto>(
    `upload/initiate-multipart`,
    requestBody
  );

// 영상 multipart 조각별 presigned url 받아오기 요청
export const getPresignedPartsAPI = (requestBody: getPresignedPartsReqDto) =>
  getRequest<getPresignedPartsReqDto, getPresignedPartsResDto>(
    `upload/get-presigned-parts`,
    requestBody
  );

// 영상 multipart 업로드 완료 처리 요청
export const completeMultipartAPI = (requestBody: completeMultipartReqDto) =>
  postRequest<completeMultipartReqDto, null>(`upload/complete-multipart`, requestBody);

// 미디어 아이템 다운로드 url 발급 요청
export const getItemDownloadUrlAPI = (mediaId: number) =>
  getRequest<null, GetItemDownloadUrlResDto>(`media/${mediaId}/download`, null);

// 앨범 다운로드 요청(바로 다운로드)
export const getAlbumDownloadUrlsAPI = (albumId: number) =>
  getRequest<null, GetAlbumDownloadUrlsResDto>(`media/albums/${albumId}/download`, null);
