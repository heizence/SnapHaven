import { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { commonResDto } from "@/lib/Dto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { authToken } = req.cookies;
  if (!authToken)
    return res.status(404).json(commonResDto(false, 404, "No auth token! wrong request", ""));

  const tokenData = verifyToken(authToken);
  if (!tokenData) return res.status(404).json(commonResDto(false, 404, "Invalid token!", ""));

  const userId = tokenData.id;

  try {
    const response = await pool.query("UPDATE Users SET refreshToken='' WHERE id = ?;", [userId]);
    console.log("response : ", response);
    if (response) {
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
    }
  } catch (e) {
    console.error(e);
    res.status(500).json(commonResDto(false, 500, "Error signing out", ""));
  }
}
