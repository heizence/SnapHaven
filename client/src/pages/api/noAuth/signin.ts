import { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import pool from "@/lib/db";
import { generateRandomToken } from "@/lib/utils";
import { commonResDto } from "@/lib/Dto";
import { User } from "@/lib/interfaces";
import { generateJWTToken } from "@/lib/Jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("signin request!");
  if (req.method !== "POST")
    return res.status(405).json(commonResDto(false, 405, "Method Not Allowed", ""));

  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json(commonResDto(false, 400, "All fields are required", ""));

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ? AND password = ?", [
      email,
      password,
    ]);
    const user = (rows as Array<User>)[0];

    if (!user) {
      return res.status(401).json(commonResDto(false, 404, "User does not exist", ""));
    }

    const token = await generateJWTToken(user.id);
    const refreshToken = generateRandomToken();

    // set cookie at this point
    // 3) Serialize cookies
    const accessCookie = cookie.serialize("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Number(process.env.JWT_EXPIRACY_TIME),
    });
    const refreshCookie = cookie.serialize("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    const updateUserRes = await pool.query("UPDATE users SET refreshToken = ? WHERE id = ?", [
      refreshToken,
      user.id,
    ]);

    if (updateUserRes) {
      res.setHeader("Set-Cookie", [accessCookie, refreshCookie]);
      return res.status(200).json(commonResDto(true, 200, "signin successful", ""));
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(commonResDto(false, 500, "Error signing in", ""));
  }
}
