import { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import pool from "@/lib/db";
import { generateRefreshToken, generateToken } from "@/lib/auth";
import { commonResDto } from "@/lib/Dto";
import { User } from "@/lib/interfaces";

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

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken();

    // set cookie at this point
    // 3) Serialize cookies
    const accessCookie = cookie.serialize("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 minutes in seconds
    });
    const refreshCookie = cookie.serialize("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    res.setHeader("Set-Cookie", [accessCookie, refreshCookie]);
    res.status(200).json(commonResDto(true, 200, "signin successful", { token, refreshToken }));
  } catch (error) {
    console.error(error);
    res.status(500).json(commonResDto(false, 500, "Error signing in", ""));
  }
}
