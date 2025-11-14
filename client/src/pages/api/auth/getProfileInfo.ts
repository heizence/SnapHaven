import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/Jwt";
import { commonResDto } from "@/lib/Dto";
import { User } from "@/lib/interfaces";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const { authToken } = req.cookies;

    const tokenData = await verifyToken(authToken);
    if (!tokenData) return res.status(401).json(commonResDto(false, 401, "Invalid token!", ""));

    const userId = tokenData.id;

    const [rows] = await pool.query("SELECT email, username, s3fileKey FROM Users WHERE id = ?", [
      userId,
    ]);
    const user = (rows as Array<User>)[0];
    let profileImgUrl = null;

    if (user.s3fileKey) {
      const { AWS_S3_PROFILE_IMG_BUCKET, AWS_REGION } = process.env;
      const fileKey = user.s3fileKey || "";
      profileImgUrl = `https://${AWS_S3_PROFILE_IMG_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${fileKey}`;
    }

    const profileInfo = {
      ...user,
      profileImgUrl,
    };

    if (!user) {
      return res.status(404).json(commonResDto(false, 404, "User not found", ""));
    }
    return res.status(200).json(commonResDto(true, 200, "User profile info", profileInfo));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error getting ProfileInfo" });
  }
}
