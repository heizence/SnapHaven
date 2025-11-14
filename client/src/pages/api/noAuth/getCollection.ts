import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { commonResDto } from "@/lib/Dto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const { id, page } = req.query;
    console.log("req.query : ", req.query);
    const params = [];
    params.push(id);

    // Calculate limits
    const offset = (Number(page) - 1) * 20;
    params.push(20, offset);

    const query = `
      SELECT id, name, width, height, \`type\`, isInList, listId, s3fileKey 
      FROM MediaFiles WHERE listId = ? ORDER BY name DESC LIMIT ? OFFSET ?`;

    const [rows] = await pool.query(query, params);
    console.log("rows : ", rows);
    return res.status(200).json(commonResDto(true, 200, "Get collection success!", rows));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error getting collection" });
  }
}
