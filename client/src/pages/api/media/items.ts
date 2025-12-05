/**
 * =================================================================
 * 파일 역할: 중앙 업로드 BFF (Backend-for-Frontend) 프록시
 * =================================================================
 * * 이 파일은 Next.js Pages Router의 Dynamic API Route를 활용하여,
 * '/api/media/...' 요청을 통합 처리한다.
 * * 1. 존재 이유 (핵심 목표): 보안 및 인증 토큰 전달
 * - 브라우저 보안 정책상 (Same-Origin Policy), HttpOnly 쿠키('accessToken')는
 * NestJS 서버(다른 도메인)로 직접 전송되지 않는다.
 * - 따라서 Next.js 서버(BFF)가 이 요청을 가로채(Proxy), 쿠키를 읽어 Authorization 헤더를 추가하고
 * NestJS 서버로 안전하게 포워딩하는 '보안 게이트웨이' 역할을 수행한다.
 * * 2. 기능 요약:
 * - **인증 헤더 삽입:** 요청의 쿠키에서 'accessToken'을 읽어 NestJS 서버로 전달한다.
 * - **Multipart 파싱:** Formidable을 사용하여 multipart/form-data를 수신 및 로컬 임시 저장한다.
 * - **조건부 분기:** URL 세그먼트([type])에 따라 NestJS의 타겟 URL과 비디오/이미지 파일 수량 검증을 분기한다.
 * - **자원 정리:** Formidable이 생성한 로컬 임시 파일을 `finally` 블록에서 반드시 삭제하여 서버 디스크 공간을 확보한다.
 * =================================================================
 */

import { NextApiRequest, NextApiResponse } from "next";
import { ResponseDto } from "@/lib/ResponseDto";
import axios from "axios";

const serverAxiosInstance = axios.create();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("[media/items BFF]start");
  console.log("[media/items BFF]req.method : ", req.method);

  const accessToken = req.cookies.accessToken; // HttpOnly 쿠키에서 토큰 읽기
  console.log("[media/items BFF]accessToken : ", accessToken);

  const apiPath = req.url?.split("/api/media/")[1];
  console.log("[media/items BFF]apiPath : ", apiPath);
  console.log("[media/items BFF]req.body : ", req.body);
  console.log("[media/items BFF]req.query : ", req.query);

  try {
    const targetUrl = `${process.env.SERVER_ADDRESS}/api/v1/media/items`;
    console.log("[media/items BFF]targetUrl : ", targetUrl);
    // Next.js 서버(BFF)가 NestJS 서버로 직접 로그인 요청
    const apiRes = await serverAxiosInstance(targetUrl, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: req.method === "POST" ? req.body : undefined,
      params: req.method === "GET" ? req.query : undefined,
    });

    const responseData = apiRes.data;
    console.log("[media/items BFF]apiRes : ", apiRes);
    console.log("[media/items BFF]responseData : ", responseData);
    return res.status(apiRes.status).json(responseData);
  } catch (error) {
    console.error(`BFF media Proxy Error (${apiPath}):`, error);
    return res
      .status(error.status)
      .json(ResponseDto.fail(error.status, error.data?.message, error));
  }
}
