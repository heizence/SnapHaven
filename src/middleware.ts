import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const authToken = req.cookies.get("authToken")?.value;
  console.log(`\n############# /src/app middleware`);

  // handle /signin page
  if (authToken && req.nextUrl.pathname.startsWith("/signin")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // handle /upload page
  if (!authToken && req.nextUrl.pathname.startsWith("/upload")) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  // handle /upload page
  if (req.nextUrl.pathname.startsWith("/api")) {
    const res = NextResponse.next();

    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200 });
    }

    if (req.nextUrl.pathname.includes("/api/auth") && !authToken) {
      return new Response(null, { status: 401 });
    }
  }

  // Otherwise, continue
  return NextResponse.next();
}

export const config = {
  matcher: ["/signin", "/upload", "/api/:path*"],
};
