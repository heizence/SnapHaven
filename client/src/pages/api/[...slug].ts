/**
 * =================================================================
 * 파일 역할: 중앙 API 포워딩 프록시 (Gateway)
 * =================================================================
 * * * 1. 존재 이유 (HttpOnly 쿠키 전달):
 * - 이 파일은 /api/auth/* 경로를 제외한 모든 API 요청 (예: /api/users/me, /api/tags)을 처리한다.
 * - 클라이언트(브라우저)가 자동으로 보낸 HttpOnly 쿠키('accessToken')를 Next.js 서버(프록시)가 읽고,
 * NestJS 서버가 요구하는 'Authorization: Bearer <token>' 헤더로 변환하여 포워딩한다.
 * - 이 과정이 없다면, NestJS 서버는 HttpOnly 쿠키를 받을 수 없어 모든 보호된 API에서 401 에러가 발생.
 * * * 2. 주요 기능:
 * - **쿠키 읽기 및 헤더 주입:** 요청 쿠키에서 'accessToken'을 추출하여 Authorization 헤더에 삽입한다.
 * - **요청 포워딩:** GET, POST, PATCH 등 모든 HTTP 메서드의 Body와 Query String을 원본 그대로 NestJS로 전달한다.
 * - **응답 중계:** NestJS의 응답을 받아 상태 코드와 데이터를 클라이언트에 그대로 전달한다.
 * =================================================================
 */

import { NextApiRequest, NextApiResponse } from "next";
import { ResponseDto } from "@/lib/ResponseDto";

const BASE_URL = `${process.env.SERVER_ADDRESS}/api/v1`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // /api/users/me -> ['users', 'me'] -> 'users/me'로 변환
  const { slug } = req.query;
  const path = (slug as string[]).join("/");

  // 요청 URL에서 쿼리 스트링 부분을 추출
  const queryIndex = req.url?.indexOf("?") || -1;
  const queryString = queryIndex !== -1 ? req.url!.substring(queryIndex) : "";

  // 브라우저가 보낸 HttpOnly 쿠키('accessToken')를 읽음
  const accessToken = req.cookies.accessToken;

  try {
    // NestJS 서버로 보낼 URL 조합
    const targetUrl = `${BASE_URL}/${path}${queryString}`;

    // 요청 헤더 준비
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    //  accessToken 있다면 Authorization 헤더에 추가
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    // NestJS 서버로 요청을 그대로 전달 (forward)
    const apiRes = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      // GET, HEAD가 아닐 때만 body를 포함
      body:
        req.method !== "GET" && req.method !== "HEAD" && req.body
          ? JSON.stringify(req.body)
          : undefined,
    });

    // NestJS 서버의 응답을 클라이언트로 그대로 전달 (pipe)
    const responseData = await apiRes.json();
    return res.status(apiRes.status).json(responseData);
  } catch (error) {
    console.error(`BFF Proxy Error (${path}):`, error);
    return res.status(500).json(ResponseDto.fail(500, "Internal Server Error", null));
  }
}
