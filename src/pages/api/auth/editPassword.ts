import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/Jwt";
import { commonResDto } from "@/lib/Dto";
import { EditPasswordRequest, User } from "@/lib/interfaces";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("EditPassword handler!");
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  const { currentPassword, newPassword }: EditPasswordRequest = req.body;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const { authToken } = req.cookies;
    const tokenData = await verifyToken(authToken);
    if (!tokenData) return res.status(401).json(commonResDto(false, 401, "Invalid token!", ""));

    const userId = tokenData.id;

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
    const user = (rows as Array<User>)[0];

    if (!user) {
      return res.status(404).json(commonResDto(false, 404, "User not found", ""));
    }

    if (currentPassword !== user.password) {
      return res.status(404).json(commonResDto(false, 404, "Current password does not match!", ""));
    }

    const result = await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      newPassword,
      userId,
    ]);

    if (result) {
      return res.status(200).json(commonResDto(true, 200, "Password edited successful", ""));
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error resetting password" });
  }
}
