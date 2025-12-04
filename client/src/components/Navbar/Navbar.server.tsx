import NavbarClient from "./Navbar.client";
import { cookies } from "next/headers";

export default async function Navbar() {
  const Cookies = await cookies();
  const accessToken = Cookies.get("accessToken")?.value || "";
  const refreshToken = Cookies.get("refreshToken")?.value || "";

  /*
  accessToken 이 만료되어도 refreshToken 으로 토큰 갱신 요청이 가능하기 떄문에 로그인된 상태로 간주.
  로그아웃 하면 accessToken 과 refreshToken 이 모두 삭제된다.
  */
  const isSignedIn = Boolean(accessToken || refreshToken);

  return <NavbarClient isSignedIn={isSignedIn} />;
}
