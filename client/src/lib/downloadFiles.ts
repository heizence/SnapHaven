import { saveAs } from "file-saver";
import { getAlbumDownloadUrlsAPI, getItemDownloadUrlAPI } from "./APIs";
import JSZip from "jszip";

// 동시에 다운로드할 최대 개수 (네트워크 병목 방지)
const DOWNLOAD_CONCURRENCY = 5;

/**
 * 단일 파일 다운로드 시작
 * 다운로드 API 호출 -> Presigned url 발급 -> s3 에서 파일 다운로드 -> 파일 반환
 */
export const startDownloadItem = async (mediaId: number) => {
  const res = await getItemDownloadUrlAPI(mediaId);
  if (res.code === 200) {
    const { url, fileName } = res.data;
    downloadSingleFile(url, fileName);
  }
};

/**
 * 앨범 다운로드 시작
 * 다운로드 API 호출 -> Presigned url 발급 -> s3 에서 파일 다운로드 -> ZIP 으로 압축하여 파일 반환
 */
export const startDownloadAlbum = async (albumId: number) => {
  const res = await getAlbumDownloadUrlsAPI(albumId);
  if (res.code === 200) {
    const { albumTitle, files } = res.data;

    await downloadAlbumAsZip(albumTitle, files, (current, total) => {
      //console.log(`다운로드 중... (${current}/${total})`);
    });
  }
};

/**
 * 단일 파일 다운로드
 * 서버에서 발급한 Presigned URL로 직접 이동하여 브라우저 다운로드 기능을 이용
 */
export const downloadSingleFile = (url: string, fileName: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName; // S3에서 Content-Disposition을 설정했으므로 작동함
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 앨범 전체 다운로드 (ZIP)
 * 1. 서버로부터 URL 리스트를 받음
 * 2. 워커 큐 방식으로 병렬 페치(Fetch)
 * 3. JSZip으로 압축 후 저장
 */

export const downloadAlbumAsZip = async (
  albumTitle: string,
  files: { url: string; fileName: string }[],
  onProgress?: (current: number, total: number) => void
) => {
  const zip = new JSZip();
  const total = files.length;
  let current = 0;

  // 병렬 다운로드를 위한 워커 로직
  const downloadWorker = async (fileList: typeof files) => {
    while (fileList.length > 0) {
      const file = fileList.shift();
      if (!file) continue;

      try {
        const response = await fetch(file.url);
        if (!response.ok) throw new Error(`Download failed: ${file.fileName}`);

        const blob = await response.blob();
        zip.file(file.fileName, blob); // ZIP 객체에 파일 추가

        current++;
        if (onProgress) onProgress(current, total);
      } catch (error) {
        console.error(`파일 다운로드 실패: ${file.fileName}`, error);
      }
    }
  };

  // 설정된 동시성만큼 워커 실행
  const queue = [...files];
  const workers = Array.from({ length: Math.min(DOWNLOAD_CONCURRENCY, total) }, () =>
    downloadWorker(queue)
  );

  await Promise.all(workers);

  // 압축 파일 생성
  const content = await zip.generateAsync(
    {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }, // 압축률 설정
    },
    (metadata) => {
      // metadata.percent를 이용해 압축 진행률도 표시 가능
      //console.log("[downloadAlbumAsZip]metadata.percent : ", metadata.percent);
    }
  );

  // 최종 저장
  const safeFileName = albumTitle.replace(/[\\/:*?"<>|]/g, "_");
  saveAs(content, `${safeFileName}.zip`);
};
