// 유저 가입 방식
export enum AuthProvider {
  EMAIL = "EMAIL",
  GOOGLE = "GOOGLE",
  APPLE = "APPLE",
}

// 콘텐츠 유형
export enum ContentType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  ALBUM = "ALBUM", // 클라이언트에서만 사용
}

export enum OrderType {
  LATEST = "LATEST",
  POPULAR = "POPULAR",
}

export enum FilterType {
  ALL = "ALL",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
}
