/**
 * =================================================================
 * 파일 역할: Google 로그인/자동 가입 및 쿠키 설정
 * =================================================================
 * * * 1. 존재 이유 (외부 ID Token 검증 처리):
 * - 클라이언트가 Google SDK를 통해 획득한 ID Token을 받아 NestJS 서버로 전달하는 특수 목적의 파일이다.
 * - NestJS는 이 토큰을 검증하고 (유효성, 자동 가입 처리), 일반 로그인과 동일한 형태의 JWT를 반환한다.
 * * * 2. 주요 기능:
 * - **NestJS 호출:** ID Token을 NestJS의 /auth/google 엔드포인트로 전달한다.
 * - **HttpOnly 쿠키 설정 (핵심):** NestJS로부터 받은 JWT를 추출하여 HttpOnly 쿠키로 변환, 설정하여 클라이언트에 응답한다.
 * - **통합 아키텍처:** 일반 로그인(signin.ts)과 동일한 방식으로 HttpOnly 쿠키를 설정하여, 모든 인증 방식이 동일한 서버 컴포넌트/미들웨어 인증 흐름을 따르도록 보장한다.
 * =================================================================
 */

import { NextApiRequest, NextApiResponse } from "next";
import { ResponseDto } from "@/lib/ResponseDto";
import { serializeAuthCookies } from "@/lib/authCookieUtils";

export default async function googleSignInHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json(ResponseDto.fail(400, "accessToken이 필요합니다.", null));
  }

  try {
    const targetUrl = `${process.env.SERVER_ADDRESS}/api/v1/auth/google`;

    // Next.js 서버(BFF)가 NestJS 서버로 직접 로그인 요청
    const apiRes = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: accessToken }),
    });

    const responseData = await apiRes.json();

    // 서버가 401 (인증 실패) 등을 반환한 경우, 쿠키 설정 없이 그대로 에러 반환
    if (!apiRes.ok) {
      return res.status(apiRes.status).json(responseData);
    }

    // 서버에서 받은 JWT 추출
    const { access_token, refresh_token } = responseData.data;

    // HttpOnly 쿠키 설정
    const cookies = serializeAuthCookies(access_token, refresh_token);
    res.setHeader("Set-Cookie", cookies);

    return res.status(apiRes.status).json(responseData);
  } catch (error) {
    console.error(`Google Sign-In Proxy Error:`, error);
    return res.status(500).json(ResponseDto.fail(500, "Internal Server Error", null));
  }
}
