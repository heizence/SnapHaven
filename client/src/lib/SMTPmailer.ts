import nodemailer from "nodemailer";
import { SendMailRequest } from "./interfaces";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(request: SendMailRequest) {
  try {
    /*
    request example
    {
      from: process.env.SMTP_FROM,
      to,
      subject: "Your Password Reset Code",
      text: `Your password reset code is: ${code}`,
      html: `<p>Your password reset code is: <strong>${code}</strong></p>`,
    }
    */
    const info = await transporter.sendMail(request);
    console.log("Email has sent:", info.messageId);
  } catch (error) {
    console.error("sending email has failed : ", error);
    throw Error();
  }
}
