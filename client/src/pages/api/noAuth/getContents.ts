import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { commonResDto } from "@/lib/Dto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });

  try {
    const { type, page, keyword } = req.query;
    console.log("req.query : ", req.query);

    // Build dynamic WHERE clauses
    const whereClauses = [];
    const params = [];

    if (type !== "all") {
      //whereClauses.push("`type` = ?");
      whereClauses.push("`type` LIKE CONCAT('%', ?, '%')");
      params.push(type);
    }

    if (keyword) {
      whereClauses.push("name LIKE CONCAT(`%`, ?, `%`)");
      params.push(`%${keyword}%`);
    }

    const whereSql = whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : "";
    console.log("wheresql : ", whereSql);

    // Calculate limits
    const offset = (Number(page) - 1) * 20;
    params.push(20, offset);

    /**
     * Files cotained in any list(whose isInList value is 1) are considered as a one single file.
     * In main page, list files are rendered same as a non-list file.
     */
    const query = `
      SELECT id, name, width, height, \`type\`, isInList, listId, s3fileKey 
      FROM (
        SELECT 
          id, name, width, height, \`type\`, isInList, listId, s3fileKey,      
          ROW_NUMBER() OVER (
            PARTITION BY 
              CASE 
                WHEN listId IS NOT NULL THEN listId 
                ELSE id 
              END
            ORDER BY name ASC
          ) AS rn
        FROM MediaFiles ${whereSql}
      ) AS ranked 
      WHERE ranked.rn = 1 
      ORDER BY name DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, params);
    console.log("rows : ", rows);
    return res.status(200).json(commonResDto(true, 200, "Get contents success!", rows));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error getting contents" });
  }
}
