import crypto from "crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const HASH_SECRET = process.env.HASH_SECRET || process.env.NEXT_PUBLIC_HASH_SECRET;

// Hash string(especially password)
export const hashString = async (password: string): Promise<string> => {
  const hashedPassword = crypto.createHmac("sha256", HASH_SECRET).update(password).digest("hex");
  return hashedPassword;
};

// Generate JWT Token
export const generateJWTToken = (userId: number): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "15min" });
};

export const generateRandomToken = (byte: number = 64): string => {
  return crypto.randomBytes(byte).toString("hex");
};

// Verify JWT Token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
