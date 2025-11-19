import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value || "";
  const refreshToken = req.cookies.get("refreshToken")?.value || "";

  const isSignedIn = Boolean(accessToken && refreshToken);
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
