import axios from "axios";

import {
  CheckEmailRequest,
  CheckEmailResponse,
  CheckUsernameRequest,
  CheckUsernameResponse,
  GetProfileInfoRequest,
  GetProfileInfoResponse,
  ResetPasswordRequest,
  SignInRequest,
  SignInResponse,
  SignUpRequest,
  SignUpResponse,
  UploadFileResponse,
  CheckResetPwInfoRequest,
  EditPasswordRequest,
  DeleteAccountRequest,
} from "./interfaces";

/** 기본적인 API 요청 method 형식
 * 응답값(성공, 실패)을 return 하도록 되어 있음. await 를 이용하여 값을 받으면 됨.
 * 콜백 함수를 넘겨줘서 응답 수신 후 콜백 함수를 실행하게 할 수도 있음.
 */

const axiosInstance = axios.create({ withCredentials: true });

const retryRequest = (error) => {
  console.log("\n[retryRequest]");
  if (error.config && !error.config.__isRetryRequest) {
    error.config.__isRetryRequest = true;
    return axiosInstance.request(error.config);
  }
  return Promise.reject(error);
};

const reissueTokenRequest = async (error) => {
  console.log("axios interceptors error : ", error);
  console.log("path : ", error.request.responseURL || "");
  if (error.status === 401) {
    const res = await reissueToken();
    console.log("reissue token res : ", res);
    if (res.success) {
      return retryRequest(error);
    }
  }
  return Promise.reject(error);
};

const commonAPI = async <TRequest, TResponse>(
  needAuth = true,
  method: string = "POST",
  path: string,
  reqParamsOrBody: TRequest
): Promise<TResponse> => {
  const ipAddress = process.env.NEXT_PUBLIC_IP_ADDRESS + "api/";
  const baseUrl = needAuth ? ipAddress + "auth/" : ipAddress + "noAuth/";

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => reissueTokenRequest(error)
  );

  return axiosInstance({
    baseURL: baseUrl,
    url: path,
    method,
    headers: {
      Accept: "application/json",
    },
    data: method === "POST" ? reqParamsOrBody : undefined,
    params: method === "GET" ? reqParamsOrBody : undefined,
    timeout: 40000,
  })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      return error.response.data;
    });
};

/** 데이터(이미지, 비디오 등) 전송 API 요청 method 형식
 * 응답값(성공, 실패)을 return 하도록 되어 있음. await 를 이용하여 값을 받으면 됨.
 * 콜백 함수를 넘겨줘서 응답 수신 후 콜백 함수를 실행하게 할 수도 있음.
 */
const commonMultipartAPI = async <TRequest, TResponse>(
  needAuth = true,
  path: string,
  formData: TRequest
): Promise<TResponse> => {
  const ipAddress = process.env.NEXT_PUBLIC_IP_ADDRESS + "api/";
  const baseUrl = needAuth ? ipAddress + "auth/" : ipAddress + "noAuth/";
  console.log("## commonMultipartAPI");
  console.log("path : ", path);
  // Add a response interceptor
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => reissueTokenRequest(error)
  );

  return axiosInstance({
    baseURL: baseUrl,
    url: path,
    method: "POST",
    headers: {
      //Accept: "application/json",
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
      return error.response.data;
    });
};

const _commonMultipartAPI = async <TRequest, TResponse>(
  needAuth = true,
  path: string,
  formData: TRequest
): Promise<TResponse> => {
  const ipAddress = process.env.NEXT_PUBLIC_IP_ADDRESS + "api/";
  const baseUrl = needAuth ? ipAddress + "auth/" : ipAddress + "noAuth/";

  return axios({
    baseURL: baseUrl,
    url: path,
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data",
    },
    data: formData,
    timeout: 80000,
  })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error(`[commonMultipartAPI] [${path}]error : `, error);
      return error.response.data;
    });
};

const noAuthGetRequest = <TRequest, TResponse>(path: string, reqParamsOrBody: TRequest) =>
  commonAPI<TRequest, TResponse>(false, "GET", path, reqParamsOrBody);

const noAuthPostRequest = <TRequest, TResponse>(path: string, reqParamsOrBody: TRequest) =>
  commonAPI<TRequest, TResponse>(false, "POST", path, reqParamsOrBody);

const getRequest = <TRequest, TResponse>(path: string, reqParamsOrBody: TRequest) =>
  commonAPI<TRequest, TResponse>(true, "GET", path, reqParamsOrBody);

const postRequest = <TRequest, TResponse>(path: string, reqParamsOrBody: TRequest) =>
  commonAPI<TRequest, TResponse>(true, "POST", path, reqParamsOrBody);

const multipartRequest = <TRequest, TResponse>(path: string, formData: TRequest) =>
  commonMultipartAPI<TRequest, TResponse>(true, path, formData);

export const signinAPI = (requestBody: SignInRequest) =>
  noAuthPostRequest<SignInRequest, SignInResponse>("signin", requestBody);

export const signoutAPI = () => postRequest<null, null>("signout", null);

export const checkEmailAPI = (requestBody: CheckEmailRequest) =>
  noAuthPostRequest<CheckEmailRequest, CheckEmailResponse>("checkEmail", requestBody);

export const checkUsernameAPI = (requestBody: CheckUsernameRequest) =>
  noAuthPostRequest<CheckUsernameRequest, CheckUsernameResponse>("checkUsername", requestBody);

export const signupAPI = (requestBody: SignUpRequest) =>
  noAuthPostRequest<SignUpRequest, SignUpResponse>("signup", requestBody);

export const getProfileInfoAPI = () =>
  getRequest<null, GetProfileInfoResponse>("getProfileInfo", null);

export const getUserContentsAPI = (requestBody: GetProfileInfoRequest) =>
  getRequest<GetProfileInfoRequest, GetProfileInfoResponse>("getProfileInfo", requestBody);

export const resetPasswordAPI = (requestBody: ResetPasswordRequest) =>
  noAuthPostRequest<ResetPasswordRequest, null>("resetPassword", requestBody);

export const uploadFileAPI = (requestBody: FormData) =>
  multipartRequest<FormData, UploadFileResponse>("files/upload", requestBody);

export const checkResetPasswordInfoAPI = (requestBody: CheckResetPwInfoRequest) =>
  noAuthPostRequest<CheckResetPwInfoRequest, null>("checkResetPasswordInfo", requestBody);

export const editProfileAPI = (requestBody: FormData) =>
  multipartRequest<FormData, null>("editProfile", requestBody);

export const editPasswordAPI = (requestBody: EditPasswordRequest) =>
  postRequest<EditPasswordRequest, null>("editPassword", requestBody);

export const deleteAccountAPI = (requestBody: DeleteAccountRequest) =>
  postRequest<DeleteAccountRequest, null>("delete", requestBody);

export const reissueToken = () => noAuthPostRequest<null, null>("reissueToken", null);
