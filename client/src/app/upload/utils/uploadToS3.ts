const MAX_RETRIES = 5;

// 개별 part 업로드 요청
async function uploadPartWithRetry(url: string, blob: Blob, attempt = 1): Promise<Response> {
  console.log("uploadPartWithRetry. url : ", url);
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": blob.type },
      body: blob,
    });
    if (!res.ok) throw new Error(`Part upload failed: ${res.status}`);
    return res;
  } catch (err) {
    if (attempt >= MAX_RETRIES) throw err;
    await new Promise((r) => setTimeout(r, 500 * attempt));
    return uploadPartWithRetry(url, blob, attempt + 1);
  }
}

// 스마트 업로드 엔트리포인트
export async function uploadFilesToS3({
  files,
  presignedData,
}: {
  files: File[];
  presignedData: any[];
}) {
  const uploadedKeys: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const info = presignedData[i];
    console.log("file.size : ", file.size);

    // 단일 파일 PUT 업로드
    await uploadPartWithRetry(info.signedUrl, file);
    uploadedKeys.push(info.s3Key);
  }

  return uploadedKeys;
}
