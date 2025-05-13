import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { hashString } from "@/lib/auth";
import { commonResDto } from "@/lib/Dto";
import { User } from "@/lib/interfaces";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json(commonResDto(false, 405, "Method Not Allowed", ""));
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json(commonResDto(false, 400, "All fields are required", ""));

  try {
    // 이메일 중복체크
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = (rows as Array<User>)[0];

    if (user) {
      return res
        .status(401)
        .json(commonResDto(false, 401, "The email has already been registered.", ""));
    }

    // 이메일로 회원가입
    const hashedPassword = await hashString(password);
    const [result] = await pool.query("INSERT INTO users (email, password) VALUES (?, ?)", [
      email,
      hashedPassword,
    ]);

    res.status(201).json(
      commonResDto(true, 201, "User has been registered successfully", {
        userId: (result as any).insertId,
      })
    );
  } catch (error) {
    console.error(error);
    res.status(500).json(commonResDto(false, 500, "Error registering user", ""));
  }
}
