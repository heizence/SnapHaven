import { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import pool from "@/lib/db";
import { generateJWTToken } from "@/lib/Jwt";
import { generateRandomToken } from "@/lib/utils";
import { commonResDto } from "@/lib/Dto";
import { User } from "@/lib/interfaces";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json(commonResDto(false, 405, "Method Not Allowed", ""));

  const { refreshToken } = req.cookies;
  if (!refreshToken)
    return res.status(400).json(commonResDto(false, 400, "All fields are required", ""));

  try {
    const [rows] = await pool.query(
      "SELECT id, email, password, username, profileImgUrl, refreshToken FROM Users WHERE refreshToken = ?",
      [refreshToken]
    );
    const user = (rows as Array<User>)[0];

    if (!user) {
      return res.status(404).json(commonResDto(false, 404, "User does not exist", ""));
    }

    const newToken = await generateJWTToken(user.id);
    const newRefreshToken = generateRandomToken();

    await pool.query("UPDATE users SET refreshToken = ? WHERE id = ?", [newRefreshToken, user.id]);

    const accessCookie = cookie.serialize("authToken", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Number(process.env.JWT_EXPIRACY_TIME),
    });
    const refreshCookie = cookie.serialize("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    res.setHeader("Set-Cookie", [accessCookie, refreshCookie]);
    console.log("reissue token success!!");
    return res
      .status(200)
      .json(commonResDto(true, 200, "reissue token success", { newToken, newRefreshToken }));
  } catch (error) {
    console.error(error);
    res.status(500).json(commonResDto(false, 500, "Error reissuing token", ""));
  }
}
