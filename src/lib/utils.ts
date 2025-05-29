import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { randomBytes } from "crypto";
import crypto from "crypto";

const HASH_SECRET = process.env.HASH_SECRET || process.env.NEXT_PUBLIC_HASH_SECRET || "";

// Hash string(especially password)
export const hashString = async (password: string): Promise<string> => {
  const hashedPassword = crypto.createHmac("sha256", HASH_SECRET).update(password).digest("hex");
  return hashedPassword;
};

export const generateRandomToken = (bytes: number = 32): string => {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  //return crypto.randomBytes(byte).toString("hex");
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 이메일 형식 검증 함수
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 사용자 이름 형식 검증 함수
export const isValidUsername = (username: string): boolean => {
  // ^           start of string
  // [A-Za-z0-9] any upper/lower letter or digit
  // {1,19}      repeat 1 up to 19 times
  // $           end of string
  const re = /^[A-Za-z0-9]{1,19}$/;
  return re.test(username);
};

export const generateRandomString = (length: number = 8): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "0123456789";
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
};

export const convertToMySQLDatetime = (d: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    [d.getUTCFullYear(), pad(d.getUTCMonth() + 1), pad(d.getUTCDate())].join("-") +
    " " +
    [pad(d.getUTCHours()), pad(d.getUTCMinutes()), pad(d.getUTCSeconds())].join(":")
  );
};
