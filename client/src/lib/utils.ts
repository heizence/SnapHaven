import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

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
  const re = /^[A-Za-z0-9]{1,19}$/;
  return re.test(username);
};

// 비밀번호 형식 검증 함수(비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 함)
export const isValidPassword = (password: string) => {
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
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

export const formatDate = (dateString: string) => {
  // dateString 은 서버에서 받은 ISO 8601 형식의 날짜 문자열
  // 예) "2025-11-14T10:30:00.000Z";
  const date = new Date(dateString);

  // 한국어/숫자만 사용하는 포맷 (원하시는 '2025.11.14' 형식)
  const formatterKR = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  // 결과: "2025. 11. 14." (일부 브라우저에서 공백이 포함될 수 있음)

  const formattedDate = formatterKR.replace(/\s/g, "").slice(0, -1);
  return formattedDate;
};
