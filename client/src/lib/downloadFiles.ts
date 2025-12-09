import { saveAs } from "file-saver";
import { getDownloadUrlAPI } from "./APIs";
import { GetDownloadUrlRequest } from "./interfaces";

/**
 * 서버에 다운로드 요청을 보내고, 받은 Presigned URL을 사용하여 다운로드를 시작한다.
 * @param mediaId 다운로드할 미디어 아이템 ID
 * @param filename (선택 사항) 다운로드 파일명 (서버에서 받은 것을 우선 사용)
 */
export async function handleDownloadContent(s3Key: string): Promise<void> {
  if (typeof window === "undefined") {
    console.error("This function must be run in the browser environment.");
    return;
  }

  try {
    // 1. 서버 API 호출 및 Presigned URL 및 파일명 받기
    const request: GetDownloadUrlRequest = {
      s3Key,
    };
    const response = await getDownloadUrlAPI(request);

    if (response.code !== 200 || !response.data) {
      alert(`다운로드 링크 생성에 실패했습니다: ${response.message}`);
      console.error("API response failed:", response);
      return;
    }

    const { downloadUrl, fileName } = response.data;

    // 2-1. S3 Public URL로 파일 데이터를 Fetch
    const fileResponse = await fetch(downloadUrl);

    if (!fileResponse.ok) {
      throw new Error(`S3 파일 다운로드 실패. 상태 코드: ${fileResponse.status}`);
    }

    // 2-2. 파일 데이터를 Blob 객체로 변환
    const blob = await fileResponse.blob();

    // 2-3. Blob 객체에 대한 로컬 URL (Object URL) 생성
    const blobUrl = window.URL.createObjectURL(blob);

    // 2-4. 동적 <a> 태그를 생성하여 다운로드 강제 실행
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", fileName); // 파일명 지정 (로컬 URL에 대해서는 잘 작동함)

    document.body.appendChild(link);
    link.click(); // 다운로드 시작
    document.body.removeChild(link);

    // 2-5. 메모리 해제 (매우 중요)
    window.URL.revokeObjectURL(blobUrl);

    console.log(`[Download] ${fileName} 다운로드 시작. 브라우저 렌더링 방지 성공.`);
  } catch (error) {
    console.error("An error occurred during download process:", error);
    alert("콘텐츠 다운로드 중 오류가 발생했습니다.");
  }
}

/**
 * 앨범 전체 ZIP 다운로드 기능을 서버 스트리밍 방식으로 처리합니다.
 * @param albumId 앨범 ID
 * @param albumTitle ZIP 파일 이름에 사용할 앨범 제목 (선택 사항)
 */
export async function handleAlbumZipDownload(albumId: number): Promise<void> {
  console.log("# handleAlbumZipDownload start. albumId : ", albumId);
  if (typeof window === "undefined") return;

  try {
    console.log(`[ZIP] 앨범 ID ${albumId} ZIP 다운로드 요청 시작 (서버 스트리밍).`);

    // 1. 서버에 스트리밍 요청 및 ZIP Blob 데이터 획득
    const { blob, fileName } = await postAlbumZipDownload(albumId);

    // 2. [CRITICAL] Blob 객체를 사용하여 파일 저장 실행
    saveAs(blob, fileName);

    console.log(`[handleAlbumZipDownload] ${fileName} 다운로드 시작됨. (서버 스트림 완료)`);

    // 3. 서버에 다운로드 카운트 기록 요청 (선택 사항: 카운트 기록 시)
    // 서버에서 ZIP 스트리밍 전에 카운트를 기록하는 것이 더 안전하지만,
    // 만약 카운트가 별도 API라면 여기에 호출 추가: await requestAlbumDownloadAPI(albumId);
  } catch (error) {
    console.error("[handleAlbumZipDownload]ZIP 다운로드 중 오류 발생:", error.message);
    alert(`ZIP 다운로드 중 치명적인 오류가 발생했습니다: ${error.message}`);
  }
}

/**
 * 앨범 ZIP 다운로드를 서버에 요청하고 ZIP 파일 스트림을 Blob 형태로 받습니다.
 * @param albumId 다운로드할 앨범 ID
 * @returns ZIP 파일 데이터를 포함하는 Blob 객체
 */
export const postAlbumZipDownload = async (
  albumId: number
): Promise<{ blob: Blob; fileName: string }> => {
  const url = `${process.env.NEXT_PUBLIC_SERVER_ADDRESS}media/album/download/${albumId}`;
  const response = await fetch(url, {
    method: "POST",
  });

  // 서버는 Content-Disposition 헤더에 파일명을 포함하여 스트리밍을 반환합니다.
  const contentDisposition = response.headers.get("Content-Disposition");
  let fileName = `Album_${albumId}.zip`;

  if (contentDisposition) {
    // Content-Disposition에서 filename을 추출합니다. (서버에서 설정한 값)
    const match = contentDisposition.match(/filename\*?=['"]?([^'"]*)/i);
    if (match && match[1]) {
      fileName = decodeURI(match[1]);
    }
  }

  if (!response.ok) {
    // 서버에서 JSON 오류 메시지를 보냈을 수 있으므로 텍스트로 읽어 오류를 던집니다.
    const errorText = await response.text();
    let errorMessage = `ZIP 파일 다운로드 요청 실패: HTTP ${response.status}`;

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      // JSON 파싱 실패 시 서버가 스트림을 중단했음을 알림
    }

    throw new Error(errorMessage);
  }

  // 응답 본문을 Blob 형태로 변환
  return {
    blob: await response.blob(),
    fileName: fileName,
  };
};
