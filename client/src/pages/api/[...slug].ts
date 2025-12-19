/**
 * =================================================================
 * 파일 역할: 중앙 API 포워딩 프록시 (Gateway)
 * =================================================================
 * * * 1. 존재 이유 (HttpOnly 쿠키 전달):
 * - 이 파일은 /api/auth/* 경로를 제외한 모든 API 요청 (예: /api/users/me, /api/tags)을 처리한다.
 * - 클라이언트(브라우저)가 자동으로 보낸 HttpOnly 쿠키('accessToken')를 Next.js 서버(프록시)가 읽고,
 * NestJS 서버가 요구하는 'Authorization: Bearer <token>' 헤더로 변환하여 포워딩한다.
 * - 이 과정이 없다면, NestJS 서버는 HttpOnly 쿠키를 받을 수 없어 모든 보호된 API에서 401 에러가 발생.
 * * * 2. 주요 기능:
 * - **쿠키 읽기 및 헤더 주입:** 요청 쿠키에서 'accessToken'을 추출하여 Authorization 헤더에 삽입한다.
 * - **요청 포워딩:** GET, POST, PATCH 등 모든 HTTP 메서드의 Body와 Query String을 원본 그대로 NestJS로 전달한다.
 * - **응답 중계:** NestJS의 응답을 받아 상태 코드와 데이터를 클라이언트에 그대로 전달한다.
 * =================================================================
 */

import { NextApiRequest, NextApiResponse } from "next";
import { ResponseDto } from "@/types/ResponseDto";
import { IncomingForm, Files, File as FormidableFile } from "formidable";
import * as fs from "fs";
import axios from "axios";
import FormData from "form-data";
import getRawBody from "raw-body";
import { clearAuthCookies } from "@/lib/authCookieUtils";

// 요청 path 가 다음 중 하나에 해당 시 쿠키 삭제해 주기
const pathsToCleanCookies = ["users/me/delete"];

export const config = {
  api: {
    bodyParser: false, // multipart/form-data 처리를 위해 비활성화
  },
};

const BASE_URL = `${process.env.SERVER_ADDRESS}/api/v1`;
const serverAxiosInstance = axios.create();

// multipart 요청 포워딩
async function handleMultipart(req: NextApiRequest, res: NextApiResponse, targetUrl: string) {
  console.log("[...slug.ts]handleMultipart start.");
  console.log("targetUrl : ", targetUrl);
  const accessToken = req.cookies.accessToken;
  const form = new IncomingForm({ multiples: true });

  const { fields, files } = await new Promise<{ fields: any; files: Files }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

  // console.log("[...slug.ts]fields : ", fields);
  // console.log("[...slug.ts]files : ", files);

  const uploadedFiles = files.files || files.file;
  const fileArray = Array.isArray(uploadedFiles)
    ? uploadedFiles
    : uploadedFiles
    ? [uploadedFiles]
    : [];

  if (fileArray.length === 0) {
    return res.status(400).json(ResponseDto.fail(400, "No files received", null));
  }

  const formData = new FormData();
  const tempFilesToClean: FormidableFile[] = [];

  // 텍스트 필드 추가
  Object.keys(fields).forEach((key) => {
    const value = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
    formData.append(key, value);
  });

  // 파일 추가
  for (const file of fileArray as FormidableFile[]) {
    tempFilesToClean.push(file);

    const stream = await fs.createReadStream(file.filepath);
    console.log("[...slug.ts]stream : ", stream);
    formData.append("file", stream, {
      filename: file.originalFilename || "upload",
      contentType: file.mimetype || "application/octet-stream",
      knownLength: file.size,
    });
  }

  console.log("[...slug.ts]req.method :", req.method);
  //console.log("[...slug.ts]formData :", formData);
  // NestJS 호출
  let apiRes;
  try {
    apiRes = await serverAxiosInstance.post(targetUrl, formData, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...formData.getHeaders(),
      },
    });
  } finally {
    // 임시 파일 삭제
    tempFilesToClean.forEach((f) => fs.unlinkSync(f.filepath));
  }

  return res.status(apiRes.status).json(apiRes.data);
}

// JSON 요청 포워딩
async function handleJson(
  req: NextApiRequest,
  res: NextApiResponse,
  targetUrl: string,
  path: string
) {
  console.log("[...slug.ts]handleJson start.");
  const accessToken = req.cookies.accessToken;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  let body: any = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const raw = await getRawBody(req);
    body = raw.length ? JSON.parse(raw.toString("utf-8")) : undefined;
  }

  const apiRes = await serverAxiosInstance(targetUrl, {
    method: req.method,
    headers,
    data: body,
  });

  // 특정 요청 시 쿠키(토큰) 삭제해 주기
  if (pathsToCleanCookies.includes(path)) {
    // NestJS 요청 성공 여부와 "상관없이" 쿠키를 삭제
    const deletedCookies = clearAuthCookies();
    res.setHeader("Set-Cookie", deletedCookies);
  }
  return res.status(apiRes.status).json(apiRes.data);
}

// main proxy handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  const path = (slug as string[]).join("/");

  const queryIndex = req.url?.indexOf("?") ?? -1;
  const queryString = queryIndex >= 0 ? req.url!.substring(queryIndex) : "";

  const targetUrl = `${BASE_URL}/${path}${queryString}`;

  try {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) await handleMultipart(req, res, targetUrl);
    else await handleJson(req, res, targetUrl, path);
  } catch (error) {
    //    console.error("BFF Proxy Error:", error.response.data);
    return res
      .status(error.status)
      .json(
        ResponseDto.fail(error.status, error.response?.data.message || "에러가 발생했습니다.", null)
      );
  }
}
