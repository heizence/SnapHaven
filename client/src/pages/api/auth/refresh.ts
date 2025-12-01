/**
 * =================================================================
 * 파일 역할: 토큰 재발급(새로고침)
 * =================================================================
 * * * 1. 존재 이유 (보안 게이트웨이):
 * - 클라이언트의 일반 로그인 요청을 받아 NestJS에 전달하고, 반환된 JWT를 브라우저에 HttpOnly 쿠키로 설정하는 특수 목적의 파일이다.
 * - NextAuth.js의 Credentials Provider로 통합할 수 있으나, 현재는 순수 Next.js API Route로 구현되어 있다.
 * * * 2. 주요 기능:
 * - **NestJS 호출:** 클라이언트에 저장한 accessToken 이 만료되었을 때 refreshToken 을 NestJS의 /auth/refresh 로 전달한다.
 * - **JWT 수신:** NestJS로부터 갱신된 Access Token 및 Refresh Token 이 포함된 JSON 응답을 받는다.
 * - **쿠키 설정 (핵심):** 받은 JWT를 **'Set-Cookie' 헤더**에 담아 HttpOnly 쿠키로 브라우저에 설정한다. (로그인 상태 유지의 시작점)
 * - **토큰 은닉:** JWT를 응답 본문에 노출하지 않고 쿠키로만 전달하여 보안을 유지한다.
 * =================================================================
 */

import { NextApiRequest, NextApiResponse } from "next";
import { ResponseDto } from "@/lib/ResponseDto";
import { serializeAuthCookies } from "@/utils/authCookieUtils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json(ResponseDto.fail(405, "Method Not Allowed", null));
  }

  try {
    const targetUrl = `${process.env.SERVER_ADDRESS}/api/v1/auth/refresh`;
    const refreshToken = req.cookies.refreshToken;

    // Next.js 서버(BFF)가 NestJS 서버로 직접 로그인 요청
    const apiRes = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${refreshToken}` },
      body: JSON.stringify(req.body),
    });

    const responseData = await apiRes.json();

    // 서버가 401 (인증 실패) 등을 반환한 경우, 쿠키 설정 없이 그대로 에러 반환
    if (!apiRes.ok) {
      return res.status(400).json(responseData); // 401 무한루프 방지를 위해 400 으로 반환
    }

    // 서버에서 받은 JWT 추출
    const { access_token, refresh_token } = responseData.data;

    // HttpOnly 쿠키 설정
    const cookies = serializeAuthCookies(access_token, refresh_token);
    res.setHeader("Set-Cookie", cookies);

    return res.status(apiRes.status).json(responseData);
  } catch (error) {
    console.error("BFF /api/auth/refresh Error:", error);
    return res.status(500).json(ResponseDto.fail(500, "Internal Server Error", null));
  }
}
