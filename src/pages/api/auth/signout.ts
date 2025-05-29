import { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import { commonResDto } from "@/lib/Dto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    res.setHeader("Set-Cookie", [
      cookie.serialize("authToken", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      }),
      cookie.serialize("refreshToken", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      }),
    ]);
    res.status(200).json(commonResDto(true, 200, "Signed out successfully.", ""));
  } catch (e) {
    console.error(e);
    res.status(500).json(commonResDto(false, 500, "Error signing out", ""));
  }
}
