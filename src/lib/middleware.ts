import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token"); // 예제: 로그인 토큰이 쿠키에 저장된 경우

  const isLoggedIn = !!token; // 토큰이 존재하면 로그인 상태

  //   if (!isLoggedIn && req.nextUrl.pathname.startsWith("/upload")) {
  //     return NextResponse.redirect(new URL("/login", req.url));
  //   }

  return NextResponse.next(); // 계속 진행
}

// 특정 경로에만 미들웨어 적용 (업로드 페이지 보호)
export const config = {
  //matcher: ["/upload"],
};
