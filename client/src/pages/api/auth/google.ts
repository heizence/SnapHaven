import { NextApiRequest, NextApiResponse } from "next";
import { ResponseDto } from "@/lib/ResponseDto";
import { serializeAuthCookies } from "@/utils/authCookieUtils";

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
