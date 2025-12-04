import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value || "";
  const refreshToken = req.cookies.get("refreshToken")?.value || "";

  /*
  accessToken 이 만료되어도 refreshToken 으로 토큰 갱신 요청이 가능하기 떄문에 로그인된 상태로 간주.
  로그아웃 하면 accessToken 과 refreshToken 이 모두 삭제된다.
  */
  const isSignedIn = Boolean(accessToken || refreshToken);
  const isSignedOut = Boolean(!accessToken && !refreshToken);

  const isPathStartsWith = (path: string) => req.nextUrl.pathname.startsWith(path);

  // handle /signin page
  if (isSignedIn && isPathStartsWith("/signin")) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (isSignedOut) {
    if (isPathStartsWith("/upload") || isPathStartsWith("/mypage")) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/signin", "/upload", "/mypage/:path*", "/api/:path*"],
};
