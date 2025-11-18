import { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import { ResponseDto } from "@/lib/ResponseDto";

const BASE_URL = `${process.env.SERVER_ADDRESS}/api/v1/auth/signin`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json(ResponseDto.fail(405, "Method Not Allowed", null));
  }

  try {
    // Next.js 서버(BFF)가 NestJS 서버로 직접 로그인 요청
    const apiRes = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const responseData = await apiRes.json();

    // NestJS가 401 (인증 실패) 등을 반환한 경우, 쿠키 설정 없이 그대로 에러 반환
    if (!apiRes.ok) {
      return res.status(apiRes.status).json(responseData);
    }

    // NestJS가 성공 응답(토큰)을 반환한 경우
    const { access_token, refresh_token } = responseData.data;

    // HttpOnly 쿠키 문자열 생성
    const accessCookie = cookie.serialize("accessToken", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // 프로덕션에선 https
      sameSite: "lax", // CSRF 방지
      path: "/", // 사이트 전체에서 쿠키 사용
      maxAge: 3600, // 1시간 (Access Token 만료 시간과 일치)
    });

    const refreshCookie = cookie.serialize("refreshToken", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // Refresh Token은 더 엄격하게
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7일 (Refresh Token 만료 시간과 일치)
    });

    // 응답 헤더에 쿠키를 설정
    res.setHeader("Set-Cookie", [accessCookie, refreshCookie]);

    // 클라이언트(브라우저)에는 성공 데이터 전송
    return res.status(apiRes.status).json(responseData);
  } catch (error) {
    console.error("BFF /api/auth/signin Error:", error);
    return res.status(500).json(ResponseDto.fail(500, "Internal Server Error", null));
  }
}
