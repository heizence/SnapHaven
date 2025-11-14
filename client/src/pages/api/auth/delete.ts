import { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import pool from "@/lib/db";
import { DeleteAccountRequest, User } from "@/lib/interfaces";
import { verifyToken } from "@/lib/Jwt";
import { commonResDto } from "@/lib/Dto";
import { deleteProfileImg } from "@/lib/s3";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  const { currentPassword }: DeleteAccountRequest = req.body;

  if (!currentPassword) return res.status(400).json({ message: "All fields are required" });

  try {
    const { authToken } = req.cookies;
    const tokenData = await verifyToken(authToken);
    if (!tokenData) return res.status(401).json(commonResDto(false, 401, "Invalid token!", ""));

    const userId = tokenData.id;
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
    const user = (rows as Array<User>)[0];
    const imgFileKey = user?.s3fileKey;

    if (!user) {
      return res.status(404).json(commonResDto(false, 404, "User not found", ""));
    }

    if (currentPassword !== user.password) {
      return res.status(404).json(commonResDto(false, 404, "Current password does not match!", ""));
    }

    const deleteRes = await pool.query("DELETE FROM users WHERE id = ?", [userId]);

    if (deleteRes) {
      if (imgFileKey) {
        deleteProfileImg(imgFileKey).catch((err) => {
          console.error("Failed to delete old S3 object:", err);
          console.log("s3 file Key : ", imgFileKey);
        });
      }

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
    }

    return res.status(200).json(commonResDto(true, 200, "Account deleted successfully.", ""));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting account" });
  }
}
