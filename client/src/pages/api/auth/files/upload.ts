import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, Fields, File as FormidableFile } from "formidable";
import fs from "fs";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/Jwt";
import { commonResDto } from "@/lib/Dto";
import { deleteContents, uploadContents } from "@/lib/s3";
import { generateUUID } from "@/lib/utils";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("api/files/upload request");
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const { authToken } = req.cookies;
  const tokenData = await verifyToken(authToken);
  if (!tokenData) return res.status(404).json(commonResDto(false, 401, "Invalid token!", ""));

  // 1) Parse the incoming multipart/form-data
  const form = new IncomingForm({
    multiples: true,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024 * 1024,
  });

  const { fields, files } = await new Promise<{
    fields: Fields;
    files: FormidableFile;
  }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files: files as any });
    });
  });

  console.log("fields : ", fields);
  console.log("files : ", files);

  const isList = fields.isList[0] === "true";
  console.log("isList : ", isList);

  //return res.status(400).json(commonResDto(false, 500, "Upload failed", ""));

  const uploadedFiles = [];

  // ── Upload to S3 (parallel) ─────────────────────────────────
  try {
    if (!files?.data || files?.data.length === 0) {
      return res.status(400).json(commonResDto(false, 400, "No files!", ""));
    }

    //const isInList = files.data.length > 1 ? 1 : 0;
    const isInList = isList ? 1 : 0;
    const listId = isInList ? generateUUID() : undefined;

    await Promise.all(
      files.data.map(async (file, _index) => {
        const uploadRes = await uploadContents(file);
        if (!uploadRes.success || !uploadRes.fileKey || !uploadRes.s3Url) {
          throw new Error("S3 upload failed");
        }
        uploadedFiles.push({
          name: file.originalFilename,
          type: file.mimetype,
          size: file.size,
          isInList,
          listId,
          index: _index,
          key: uploadRes.fileKey,
        });
      })
    );

    //return res.status(200).json(commonResDto(true, 200, "test success", ""));
  } catch (uploadErr) {
    console.error("S3 upload error:", uploadErr);
    await Promise.all(uploadedFiles.map((i) => deleteContents(i.key)));

    // cleanup temp files
    [...files.data].forEach((f) => fs.unlinkSync(f.filepath));

    return res.status(400).json(commonResDto(false, 500, "Upload failed", ""));
  }

  // ── Insert into DB with transaction ─────────────────────────
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let contentId;
    const metadata = fields.metadata || [];
    console.log("metadata : ", metadata);
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const info = JSON.parse(metadata[i]);
      console.log("info : ", info);
      contentId = generateUUID();

      await conn.query(
        "INSERT INTO MediaFiles (id, name, `size`, width, height, `type`, `isInList`, listId, `index`, s3fileKey, uploadedAt) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
        [
          contentId,
          file.name,
          file.size,
          info.width,
          info.height,
          file.type,
          file.isInList,
          file.listId,
          file.index,
          file.key,
        ]
      );
    }
    await conn.commit();
  } catch (dbErr) {
    console.error("DB transaction failed:", dbErr);
    await conn.rollback();
    // rollback S3
    await Promise.all(uploadedFiles.map((i) => deleteContents(i.key)));

    // cleanup temp files
    [...files.data].forEach((f) => fs.unlinkSync(f.filepath));
    conn.release();
    return res.status(500).json(commonResDto(false, 500, "Database error", ""));
  }
  conn.release();

  // ── Final cleanup and response ─────────────────────────────
  [...files.data].forEach((f) => fs.unlinkSync(f.filepath));

  return res.status(200).json(commonResDto(true, 200, "Content created", ""));
}
