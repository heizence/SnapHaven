import axios from "axios";
//import "../../envConfig.ts";

/** 기본적인 API 요청 method 형식
 * 응답값(성공, 실패)을 return 하도록 되어 있음. await 를 이용하여 값을 받으면 됨.
 * 콜백 함수를 넘겨줘서 응답 수신 후 콜백 함수를 실행하게 할 수도 있음.
 */
const commonAPI = async (
  needAuth = true,
  method: string = "POST",
  path: string,
  reqParamsOrBody
) => {
  const ipAddress = process.env.NEXT_PUBLIC_IP_ADDRESS + "/api/";
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
const commonMultipartAPI = async (needAuth, path, formData, callbackSuccess, callbackFailed) => {
  const ipAddress = process.env.IP_ADDRESS + "/api/";
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
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
    data: formData,
    timeout: 80000,
  })
    .then((response) => {
      if (callbackSuccess) callbackSuccess(response.data);
      setTimeout(() => {
        return response.data;
      }, 1000 * 5);
    })
    .catch((error) => {
      console.error(`[commonMultipartAPI] [${path}]error : `, error);
      if (callbackFailed) callbackFailed(error);
      return error.response.data;
    });
};

const noAuthGetRequest = (path, reqParamsOrBody) => commonAPI(false, "GET", path, reqParamsOrBody);
const noAuthPostRequest = (path, reqParamsOrBody) =>
  commonAPI(false, "POST", path, reqParamsOrBody);
const getRequest = (path, reqParamsOrBody) => commonAPI(true, "GET", path, reqParamsOrBody);
const postRequest = (path, reqParamsOrBody) => commonAPI(true, "POST", path, reqParamsOrBody);
const multipartRequest = (path, formData) => commonMultipartAPI(true, path, formData);

export const signinAPI = (requestBody) => postRequest("signin", requestBody);
export const checkEmailAPI = (requestBody) => noAuthPostRequest("checkEmail", requestBody);
export const signupAPI = (requestBody) => noAuthPostRequest("signup", requestBody);
