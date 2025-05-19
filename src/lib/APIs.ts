import axios from "axios";
import {
  CheckEmailRequest,
  CheckEmailResponse,
  CheckUsernameRequest,
  CheckUsernameResponse,
  ResetPasswordRequest,
  SignInRequest,
  SignInResponse,
  SignUpRequest,
  SignUpResponse,
  UploadFileRequest,
  UploadFileResponse,
  checkResetPwInfoRequest,
} from "./interfaces";
//import "../../envConfig.ts";

/** 기본적인 API 요청 method 형식
 * 응답값(성공, 실패)을 return 하도록 되어 있음. await 를 이용하여 값을 받으면 됨.
 * 콜백 함수를 넘겨줘서 응답 수신 후 콜백 함수를 실행하게 할 수도 있음.
 */

axios.defaults.withCredentials = true;

const commonAPI = async <TRequest, TResponse>(
  needAuth = true,
  method: string = "POST",
  path: string,
  reqParamsOrBody: TRequest
): Promise<TResponse> => {
  const ipAddress = process.env.NEXT_PUBLIC_IP_ADDRESS + "api/";
  const baseUrl = needAuth ? ipAddress + "auth/" : ipAddress + "noAuth/";
  const token = "your_token_here";

  return axios({
    baseURL: baseUrl,
    url: path,
    method,
    headers: {
      Accept: "application/json",
      Authorization: needAuth ? `Bearer ${token}` : undefined,
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
  const token = "your_token_here";

  const axiosInstance = axios.create();

  // Function to retry the request
  const retryRequest = (error) => {
    //glog.debug("\n[requestFileWithInterceptor]retryRequest");
    if (error.config && !error.config.__isRetryRequest) {
      error.config.__isRetryRequest = true;
      return axiosInstance.request(error.config);
    }
    return Promise.reject(error);
  };

  // Add a response interceptor
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        // Handle HTTP errors
        //console.error("requestFile error : ", error);
      } else if (error.request) {
        // Retry the request if no response was received
        //console.error("request error:", error);
        return retryRequest(error);
      } else {
        // Handle other errors
        //console.error("error.message:", error);
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance({
    baseURL: baseUrl,
    url: path,
    method: "POST",
    headers: {
      //"Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
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

export const resetPasswordAPI = (requestBody: ResetPasswordRequest) =>
  noAuthPostRequest<ResetPasswordRequest, null>("resetPassword", requestBody);

export const uploadFileAPI = (requestBody: FormData) =>
  multipartRequest<FormData, UploadFileResponse>("files/upload", requestBody);

export const checkResetPasswordInfoAPI = (requestBody: checkResetPwInfoRequest) =>
  noAuthPostRequest<checkResetPwInfoRequest, null>("checkResetPasswordInfo", requestBody);
