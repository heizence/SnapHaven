import { NextApiRequest, NextApiResponse } from "next";
import pool from "@/lib/db";
import { commonResDto } from "@/lib/Dto";
import { SendMailRequest, User } from "@/lib/interfaces";
import {
  hashString,
  generateRandomToken,
  convertToMySQLDatetime,
  generateRandomString,
} from "@/lib/utils";
import { sendEmail } from "@/lib/SMTPmailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`\nresetPassword handler`);
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  const { email } = req.body;
  console.log("email : ", email);
  if (!email) return res.status(400).json({ message: "All fields are required" });

  const conn = await pool.getConnection();

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = (rows as Array<User>)[0];

    if (!user) {
      return res
        .status(200)
        .json(
          commonResDto(
            true,
            200,
            "계정이 존재한다면 해당 계정으로 전송된 메일을 확인해 주세요.",
            ""
          )
        );
    }

    /*
    db 업데이트
    1.1회용 토큰(hash 값), 유저 이메일을 resetPasswordInfo 테이블에 저장
    2.해시 처리된 패스워드로 user 테이블 업데이트하기
    *위 2개 요청은 transaction 으로 처리되어야 함.
    3.transaction 성공 시 이메일 발송
    4.실패 시 rollback 처리
    */

    const userId = user.id;
    const oneTimeToken = generateRandomToken(32);
    const hashedToken = await hashString(oneTimeToken);
    const randomPassword = generateRandomString();
    const hashedPassword = await hashString(randomPassword);
    const tokenExpiresAt = convertToMySQLDatetime(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes after from currrent datetime

    await conn.beginTransaction();

    await conn.query(
      "INSERT INTO ResetPasswordRequests (userId, token, expiresAt, plainPassword) VALUES(?, ?, ?, ?)",
      [userId, hashedToken, tokenExpiresAt, randomPassword]
    );
    await conn.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
    await conn.commit();

    const urlParams = new URLSearchParams({
      email,
      token: oneTimeToken,
    });
    const resetPasswordURL = `${
      process.env.NEXT_PUBLIC_IP_ADDRESS
    }reset-password?${urlParams.toString()}`;

    console.log("resetPasswordURL : ", resetPasswordURL);

    // send email
    const requestObj: SendMailRequest = {
      from: `"SnapHaven" <no-reply@snaphaven.com>`,
      to: email,
      subject: "SnapHaven reset password link",
      //text: `${resetPasswordURL}`,
      html: `<p>SnapHaven reset password link<br/> <strong>${resetPasswordURL}</strong></p>`,
    };
    await sendEmail(requestObj);
    res.status(200).json(commonResDto(true, 200, "Reset link has sent to your email", ""));
  } catch (error) {
    console.error(error);
    if (conn) await conn.rollback();
    res.status(500).json(commonResDto(false, 500, "Error resetting password", ""));
  } finally {
    conn.release();
  }
}
