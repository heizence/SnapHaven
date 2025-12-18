/**
 * =================================================================
 * 파일 역할: 로그아웃 및 쿠키 삭제
 * =================================================================
 * * * 1. 존재 이유 (토큰 무효화 및 쿠키 삭제):
 * - 클라이언트의 로그아웃 요청을 처리하고, 서버와 브라우저 양쪽에서 인증 상태를 종료하는 특수 목적의 파일이다.
 * - 일반 프록시([...slug].ts)와 달리, 이 파일은 요청을 포워딩하는 것 외에 '응답 헤더를 수정(Set-Cookie: Max-Age=0)'하는 고유 로직이 필요하다.
 * * * 2. 주요 기능:
 * - **NestJS 호출:** 쿠키에서 'accessToken'을 읽어 NestJS의 /auth/signout으로 전달한다. (DB token_version 증가를 통한 강제 만료 처리)
 * - **쿠키 삭제 (핵심):** NestJS의 처리 성공 여부와 관계없이, 브라우저에 'accessToken'과 'refreshToken'을 즉시 만료시키는(Max-Age=0) Set-Cookie 헤더를 설정하여 로그아웃 상태를 확정한다.
 * =================================================================
 */

import { NextApiRequest, NextApiResponse } from "next";
import { ResponseDto } from "@/types/ResponseDto";
import { clearAuthCookies } from "@/lib/authCookieUtils";

const BASE_URL = `${process.env.SERVER_ADDRESS}/api/v1/auth/signout`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json(ResponseDto.fail(405, "Method Not Allowed", null));
  }

  const accessToken = req.cookies.accessToken;
  let apiResStatus = 200; // 기본 성공 상태
  let responseData = ResponseDto.success(200, "로그아웃 되었습니다.");

  if (accessToken) {
    try {
      const apiRes = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      apiResStatus = apiRes.status;
      responseData = await apiRes.json();
    } catch (error) {
      // 서버가 죽어있어도, 클라이언트 쿠키는 삭제해야 하므로 에러를 로깅만 하고 계속 진행
      console.error("BFF /api/auth/signout NestJS Error:", error);
    }
  }

  // NestJS 요청 성공 여부와 "상관없이" 쿠키를 삭제
  const deletedCookies = clearAuthCookies();
  res.setHeader("Set-Cookie", deletedCookies);

  return res.status(apiResStatus).json(responseData);
}
