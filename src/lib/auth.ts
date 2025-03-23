import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET;

// Hash Password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare Password
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Generate JWT Token
export const generateToken = (userId: number): string => {
  return jwt.sign({ id: userId }, SECRET_KEY, { expiresIn: "1h" });
};

// Verify JWT Token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
};
