import { initiateMultipartAPI, getPresignedPartsAPI, completeMultipartAPI } from "@/lib/APIs";

const MAX_RETRIES = 5;
const PART_SIZE = 10 * 1024 * 1024; // 10MB 단위로 쪼개기
const CONCURRENCY_LIMIT = 4; // 영상은 조각당 부하가 크므로 4~6 권장

// 개별 part 업로드 요청
async function uploadPartWithRetry(url: string, blob: Blob, attempt = 1): Promise<Response> {
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

type PresignedData = {
  fileIndex: number;
  s3Key: string;
  signedUrl: string;
};
// 서버로부터 받은 presigned url 을 이용하여 파일을 s3 에 업로드
export async function uploadFilesToS3({
  files,
  presignedData,
  concurrency = 6, // 브라우저 표준에 맞춰 6~8로 조정 (너무 높으면 오히려 독)
}: {
  files: File[];
  presignedData: PresignedData[];
  concurrency?: number;
}) {
  //const startTime = performance.now(); // 성능 측정을 위한 시간 계산
  console.log(`[Upload] 업로드 시작 - 총 파일 개수: ${files.length}`);

  const uploadedKeys: string[] = new Array(files.length);
  let currentIndex = 0;

  const worker = async () => {
    while (currentIndex < files.length) {
      const i = currentIndex++; // 점유할 인덱스 확보
      const file = files[i];
      const info = presignedData[i];

      try {
        //const fileStartTime = performance.now();  // 성능 측정을 위한 시간 계산
        await uploadPartWithRetry(info.signedUrl, file);
        //const fileEndTime = performance.now();  // 성능 측정을 위한 시간 계산

        uploadedKeys[i] = info.s3Key;

        // 개별 파일 업로드 시간 (디버깅용)
        // console.log(
        //   `파일[${i}] 업로드 완료: ${((fileEndTime - fileStartTime) / 1000).toFixed(2)}s`
        // );
      } catch (err) {
        console.error(`[Upload Error] 파일 index ${i} 실패:`, err);
        throw err; // 하나라도 실패하면 전체 프로세스 중단 (필요 시 조정 가능)
      }
    }
  };

  // 설정한 동시 실행 수만큼 워커 풀 생성
  const workers = Array.from({ length: Math.min(concurrency, files.length) }, worker);

  await Promise.all(workers);

  // 성능 측정을 위한 시간 계산
  //const endTime = performance.now(); // 시간 측정 종료
  //const totalDuration = ((endTime - startTime) / 1000).toFixed(2);
  // console.log(`[Upload Success] 모든 업로드 완료!`);
  // console.log(`⏱️ 총 소요 시간: ${totalDuration}초`);

  return uploadedKeys.filter(Boolean);
}

// 영상 multipart 업로드 처리
export async function uploadLargeVideoToS3({
  file,
  presignedData,
}: {
  file: File;
  presignedData: PresignedData;
}) {
  console.log("[uploadLargetVideoToS3]start.  : ");
  const startTime = performance.now();
  const s3Key = presignedData.s3Key;

  // 1. 업로드 시작 요청
  const initiateRes = await initiateMultipartAPI({
    fileName: file.name,
    contentType: file.type,
    s3Key,
  });
  console.log("[uploadLargetVideoToS3]initiateMultipartAPI res : ", initiateRes);
  const { uploadId } = initiateRes.data;

  const totalParts = Math.ceil(file.size / PART_SIZE);
  const partNumbers = Array.from({ length: totalParts }, (_, i) => i + 1);

  // 2. 조각별 Presigned URL 한꺼번에 받아오기
  console.log("[uploadLargetVideoToS3]getPresignedPartsAPI req : ", {
    uploadId,
    s3Key: presignedData.s3Key,
    partNumbers,
  });
  const getPresignedRes = await getPresignedPartsAPI({
    uploadId,
    s3Key: presignedData.s3Key,
    partNumbers: partNumbers.join(","),
  });
  const urls = getPresignedRes.data;
  console.log("[uploadLargetVideoToS3]getPresignedPartsAPI res : ", getPresignedRes);
  // 3. 조각 업로드 (Worker Queue 적용)
  const completedParts: { PartNumber: number; ETag: string }[] = new Array(totalParts);
  let currentIndex = 0;

  const worker = async () => {
    while (currentIndex < urls.length) {
      const i = currentIndex++; // 현재 작업할 인덱스 확보
      const part = urls[i];

      const start = (part.partNumber - 1) * PART_SIZE;
      const end = Math.min(start + PART_SIZE, file.size);
      const blob = file.slice(start, end);

      try {
        // 재시도 로직이 포함된 업로드 함수 호출
        const res = await uploadPartWithRetry(part.url, blob);
        const etag = res.headers.get("ETag");

        if (!etag) throw new Error(`Part ${part.partNumber} 업로드 후 ETag를 받지 못했습니다.`);

        // 결과 저장 (순서 보장을 위해 인덱스 활용)
        completedParts[i] = {
          PartNumber: part.partNumber,
          ETag: etag.replace(/"/g, ""), // 따옴표 제거
        };

        console.log(`[Multipart] 조각 ${part.partNumber}/${totalParts} 완료`);
      } catch (err) {
        console.error(`[Multipart Error] 조각 ${part.partNumber} 실패:`, err);
        throw err; // 조각 하나라도 최종 실패하면 중단
      }
    }
  };

  // 병렬 워커 실행 (동시 실행 수 제한)
  const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, totalParts) }, worker);
  await Promise.all(workers);

  // 4. 업로드 완료 요청 (S3 조각 합치기)
  // S3는 파트 번호 순서대로 정렬된 리스트를 요구합니다.
  const sortedParts = completedParts.sort((a, b) => a.PartNumber - b.PartNumber);

  await completeMultipartAPI({
    uploadId,
    s3Key: s3Key,
    parts: sortedParts,
  });

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  console.log(`⏱️ 대용량 영상 업로드 완료: ${duration}초`);

  return s3Key;
}
