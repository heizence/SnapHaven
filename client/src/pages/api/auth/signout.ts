import { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import { ResponseDto } from "@/lib/ResponseDto";

const BASE_URL = `${process.env.SERVER_ADDRESS}/api/v1/auth/signout`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json(ResponseDto.fail(405, "Method Not Allowed", null));
  }

  const accessToken = req.cookies.accessToken;
  let apiResStatus = 200; // 기본 성공 상태
  let responseData = ResponseDto.successWithoutData(200, "로그아웃 되었습니다.");

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
      // NestJS 서버가 죽어있어도, 클라이언트 쿠키는 삭제해야 하므로
      // 에러를 로깅만 하고 계속 진행
      console.error("BFF /api/auth/signout NestJS Error:", error);
    }
  }

  // NestJS 요청 성공 여부와 "상관없이" 쿠키를 삭제
  const deleteAccessCookie = cookie.serialize("accessToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  const deleteRefreshCookie = cookie.serialize("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  // 응답 헤더에 쿠키 삭제 설정
  res.setHeader("Set-Cookie", [deleteAccessCookie, deleteRefreshCookie]);
  // 클라이언트에 최종 응답
  return res.status(apiResStatus).json(responseData);
}
