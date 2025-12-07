// next.config.ts 설정을 위한 AWS_HOST_NAME
export const AWS_HOST_NAME = `${process.env.NEXT_PUBLIC_AWS_S3_ASSETS_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com`;

// 콘텐츠 랜더링에 사용할 URL
export const AWS_BASE_URL = `https://${AWS_HOST_NAME}/`;

export const ITEM_REQUEST_LIMIT = 40; // 1회에 요청할 미디어 아이템 갯수. 서버와 동일해야 함

/******************* Enums ******************/
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
