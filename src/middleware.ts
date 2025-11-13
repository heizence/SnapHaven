import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/Jwt";

export async function middleware(req: NextRequest) {
  const authToken = req.cookies.get("authToken")?.value || "";
  const refreshToken = req.cookies.get("refreshToken")?.value || "";

  console.log(`\n### /src/app middleware`);

  const isAuthTokenValid = Boolean(await verifyToken(authToken));
  const isSignedIn = Boolean(isAuthTokenValid && refreshToken);
  const isSignedOut = Boolean(!isAuthTokenValid && !refreshToken);
  const isTokenExpired = Boolean(!isAuthTokenValid && refreshToken);

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

  if (req.nextUrl.pathname.startsWith("/api/auth")) {
    const res = NextResponse.next();

    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (isTokenExpired) {
      console.log(`## ${req.nextUrl.pathname} 401 error!!!`);
      return new Response("", { status: 401 });
    }

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200 });
    }
  }

  // Otherwise, continue
  return NextResponse.next();
}

export const config = {
  matcher: ["/signin", "/upload", "/mypage/:path*", "/api/:path*"],
};
