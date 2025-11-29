import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { randomBytes } from "crypto";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { EachContent } from "./interfaces";

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

export const generateUUID = () => {
  const uuid = uuidv4();
  return String(uuid);
};

export const convertToMySQLDatetime = (d: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    [d.getUTCFullYear(), pad(d.getUTCMonth() + 1), pad(d.getUTCDate())].join("-") +
    " " +
    [pad(d.getUTCHours()), pad(d.getUTCMinutes()), pad(d.getUTCSeconds())].join(":")
  );
};

export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  return { width: bitmap.width, height: bitmap.height };
}

export function getVideoDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({ width: video.videoWidth, height: video.videoHeight });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video metadata"));
    };
    video.src = url;
  });
}

export const renderContentsCb = (file: EachContent) => {
  const contentsUrl = `https://${process.env.NEXT_PUBLIC_AWS_S3_CONTENTS_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${file.s3fileKey}`;

  return {
    id: file.id,
    src: contentsUrl,
    name: file.name,
    type: file.type,
    isInList: file.isInList,
    listId: file.listId,
    width: file.width,
    height: file.height,
  };
};

export const ALLOWED_VIDEO_EXTENSIONS = [
  "mp4", // 표준 — 대부분의 기기
  "mov", // iPhone/Apple 계열
  "m4v", // mp4 파생 컨테이너
  "webm", // 브라우저 기반 캡처
  "mkv", // 강력한 컨테이너 — FFmpeg 안정적
];

export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

// 확장자 추출 함수
function getFileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() || "";
}

// 이미지 파일 검증
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; reason?: string } {
  const extension = getFileExtension(file.name);

  // 0. 확장자 체크
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      reason: `지원하지 않는 이미지 형식입니다: .${extension}`,
    };
  }

  // 1. MIME 체크 (이미지인지)
  if (!file.type.startsWith("image/")) {
    return { valid: false, reason: "이미지 파일이 아닙니다." };
  }

  // 2. 용량 체크
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      reason: `파일 용량 초과: ${fileSizeMB.toFixed(2)}MB`,
    };
  }

  return { valid: true };
}

// 영상 파일 검증
export function validateVideoFile(
  file: File,
  maxSizeMB: number = 100,
  maxDurationSec: number = 60
): Promise<{ valid: boolean; reason?: string }> {
  return new Promise((resolve) => {
    const extension = getFileExtension(file.name);

    // 확장자 체크
    if (!ALLOWED_VIDEO_EXTENSIONS.includes(extension)) {
      resolve({
        valid: false,
        reason: `지원하지 않는 영상 형식입니다: .${extension}`,
      });
      return;
    }

    // 용량 체크
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      resolve({
        valid: false,
        reason: `파일 용량 초과: ${fileSizeMB.toFixed(2)}MB`,
      });
      return;
    }

    // 영상 길이 체크
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);

      if (isNaN(video.duration)) {
        resolve({ valid: false, reason: "영상 길이를 확인할 수 없습니다." });
        return;
      }

      if (video.duration > maxDurationSec) {
        resolve({
          valid: false,
          reason: `영상 길이 초과: ${video.duration.toFixed(1)}초`,
        });
      } else {
        resolve({ valid: true });
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, reason: "영상 파일 로드 실패" });
    };

    video.src = url;
  });
}
