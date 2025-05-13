import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { hashString } from "@/lib/auth";
import { commonResDto } from "@/lib/Dto";
import { ResetPasswordRecord, User } from "@/lib/interfaces";
import { convertToMySQLDatetime } from "@/lib/utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`\ncheckResetPasswordInfo handler`);
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  const { email, token } = req.body;
  if (!email || !token) return res.status(400).json({ message: "All fields are required" });

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = (rows as Array<User>)[0];

    if (!user) {
      return res.status(200).json(commonResDto(false, 404, "해당 계정이 존재하지 않습니다.", ""));
    }

    const userId = user.id;
    const hashedToken = await hashString(token);

    const [recordRows] = await pool.query(
      "SELECT token, expiresAt, plainPassword FROM ResetPasswordRequests WHERE userId = ? AND token = ?",
      [userId, hashedToken]
    );

    const record = (recordRows as Array<ResetPasswordRecord>)[0];
    const currentTime = new Date(convertToMySQLDatetime(new Date())); // Do not miss convertToMySQLDatetime method!

    if (record) {
      if (new Date(record.expiresAt) < currentTime) {
        return res.status(401).json(commonResDto(false, 401, "요청이 만료되었습니다.", ""));
      }
      return res
        .status(200)
        .json(commonResDto(true, 200, "확인 완료", { newPassword: record.plainPassword }));
    }
    return res.status(403).json(commonResDto(false, 403, "잘못된 접근입니다.", ""));
  } catch (error) {
    console.error(error);

    res.status(500).json(commonResDto(false, 500, "Error resetting password", ""));
  }
}
