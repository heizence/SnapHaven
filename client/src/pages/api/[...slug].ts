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
