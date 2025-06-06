import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { commonResDto } from "@/lib/Dto";
import { User } from "@/lib/interfaces";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("[CHECKEMAIL]handler!");
  if (req.method !== "POST")
    return res.status(405).json(commonResDto(false, 405, "Method Not Allowed", ""));

  const { email } = req.body;
  console.log("email : ", email);
  if (!email) return res.status(400).json(commonResDto(false, 400, "All fields are required", ""));

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = (rows as Array<User>)[0];

    if (user) {
      return res
        .status(401)
        .json(commonResDto(false, 401, "The email has already been registered.", ""));
    }
    res.status(200).json(commonResDto(true, 200, "Email available", ""));
  } catch (error) {
    console.error(error);
    res.status(500).json(commonResDto(false, 500, "Error occured!", ""));
  }
}
