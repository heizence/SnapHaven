import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, Fields, File as FormidableFile } from "formidable";
import pool from "@/lib/db";
import fs from "fs";
import { verifyToken } from "@/lib/Jwt";
import { commonResDto } from "@/lib/Dto";
import { deleteProfileImg, uploadProfileImg } from "@/lib/s3";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("EditProfile handler!");
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  const conn = await pool.getConnection();
  let oldKey: string | null = null;
  let newKey: string | undefined;
  let newUrl: string | undefined;

  const { authToken } = req.cookies;
  const tokenData = await verifyToken(authToken);
  if (!tokenData) return res.status(404).json(commonResDto(false, 401, "Invalid token!", ""));

  // 1) Parse the incoming multipart/form-data
  const form = new IncomingForm({
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // e.g. 10 MB limit
  });

  const { fields, files } = await new Promise<{
    fields: Fields;
    files: { [key: string]: FormidableFile };
  }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files: files as any });
    });
  });

  let hasImgFile = false;
  const email = String(fields.email);
  const username = String(fields.username);
  const profileImgRaw = files.profileImg;
  const profileImgFile = Array.isArray(profileImgRaw)
    ? profileImgRaw[0]
    : (profileImgRaw as FormidableFile);

  if (profileImgFile && profileImgFile.filepath) {
    //return res.status(400).json({ error: "No file uploaded" });
    hasImgFile = true;
  }

  console.log("hasimgfile : ", hasImgFile);
  try {
    await conn.beginTransaction();

    if (hasImgFile) {
      const [[row]] = await conn.query("SELECT s3FileKey FROM users WHERE id = ?", [tokenData.id]);
      oldKey = row?.s3FileKey;

      const uploadRes = await uploadProfileImg(profileImgFile);
      if (!uploadRes.success || !uploadRes.fileKey || !uploadRes.profileImgUrl) {
        throw new Error("S3 upload failed");
      }

      newKey = uploadRes.fileKey;
      newUrl = uploadRes.profileImgUrl;

      await conn.query(
        "UPDATE users SET email = ?, username = ?, profileImgUrl = ?, s3FileKey = ? WHERE id = ?",
        [email, username, newUrl, newKey, tokenData.id]
      );
      await conn.commit();

      // 6) Delete old image from S3 (fire and forget)
      if (oldKey) {
        deleteProfileImg(oldKey).catch((err) =>
          console.error("Failed to delete old S3 object:", err)
        );
      }
    } else {
      await conn.query("UPDATE users SET email = ?, username = ? WHERE id = ?", [
        email,
        username,
        tokenData.id,
      ]);
      await conn.commit();
    }
    return res.status(200).json(commonResDto(true, 200, "editing profile complete", ""));
  } catch (err) {
    console.error(err);
    try {
      await conn.rollback();
    } catch (e2) {}

    if (newKey) {
      try {
        await deleteProfileImg(newKey);
      } catch (e) {
        console.error("Cleanup of new S3 object failed:", e);
      }
    }

    return res.status(500).json(commonResDto(false, 500, "Error editing profile", ""));
  } finally {
    conn.release();
    // cleanup temp file
    try {
      fs.unlinkSync(profileImgFile.filepath);
    } catch (e2) {}
  }
}
