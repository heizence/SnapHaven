import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { commonResDto } from "@/lib/Dto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const { id } = req.query;
    console.log("req.query : ", req.query);

    const query = `
      SELECT id, name, width, height, \`type\`, isInList, listId, s3fileKey 
      FROM MediaFiles WHERE id = ?`;

    const [rows] = await pool.query(query, [id]);
    console.log("rows : ", rows);
    return res.status(200).json(commonResDto(true, 200, "Get each content success!", rows));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error getting content" });
  }
}
