export const AWS_BASE_URL = `https://${process.env.NEXT_PUBLIC_AWS_S3_ASSETS_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/`;

export const ITEM_REQUEST_LIMIT = 40; // 1회에 요청할 미디어 아이템 갯수. 서버와 동일해야 함

/******************* Enums ******************/
export enum ContentType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
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
