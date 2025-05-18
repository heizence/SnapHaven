import NavbarClient from "./Navbar.client";
import { cookies } from "next/headers";

export default async function Navbar() {
  // read the httpOnly “token” cookie on the server
  const Cookies = await cookies();
  const authToken = Cookies.get("authToken")?.value ?? null;
  return <NavbarClient authToken={authToken} />;
}
