import { serialize } from "cookie";

// Max Age는 서버의 JWT의 만료 시간과 일치해야 한다. (단위: 초)
const ACCESS_TOKEN_MAX_AGE = 60 * 15; // 15분
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7일

// Access Token과 Refresh Token을 HttpOnly 쿠키로 직렬화
export const serializeAuthCookies = (accessToken: string, refreshToken: string): string[] => {
  const isProd = process.env.NODE_ENV === "production";

  const baseOptions = {
    httpOnly: true,
    secure: isProd, // HTTPS 에서만 전송
    sameSite: "lax" as const, // CSRF 방지
    path: "/",
  };

  const serializedAccessToken = serialize("accessToken", accessToken, {
    ...baseOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  const serializedRefreshToken = serialize("refreshToken", refreshToken, {
    ...baseOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  return [serializedAccessToken, serializedRefreshToken];
};

// 쿠키를 즉시 만료시켜 삭제하는 유틸리티
export const clearAuthCookies = (): string[] => {
  const isProd = process.env.NODE_ENV === "production";

  // maxAge: 0을 사용하여 쿠키를 즉시 만료시키고 삭제
  const deleteCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  return [
    serialize("accessToken", "", deleteCookieOptions),
    serialize("refreshToken", "", deleteCookieOptions),
  ];
};
