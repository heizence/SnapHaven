"use client";

import { useState, useRef } from "react";
import { Upload, X, AlertCircle } from "lucide-react";
import Image from "next/image";
import DropZone from "@/components/DropZone";
import { uploadFileAPI } from "@/lib/APIs";
import { getImageDimensions, getVideoDimensions } from "@/lib/utils";

// [신규] 1. 선택 가능한 태그 목록 정의
const predefinedTags = [
  "풍경",
  "하늘",
  "바다",
  "도시",
  "야경",
  "인물",
  "동물",
  "여행",
  "음식",
  "건축",
  "자연",
  "꽃",
  "숲",
  "가을",
];

interface FileToUpload {
  fileOrigin: File;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  videoDuration?: number;
}

export default function Page() {
  const [files, setFiles] = useState<FileToUpload[]>([]);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]); // 선택된 태그 목록
  const [isAlbum, setIsAlbum] = useState(false); // 앨범으로 업로드 여부
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 핸들링 로직 (기존과 동일)
  const handleFiles = async (selectedFiles: File[]) => {
    setUploadError(null);

    // 유효성 검사 (이미지/비디오만 허용)
    const validFiles: File[] = [];
    const invalidFileNames: string[] = [];
    for (const file of selectedFiles) {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        validFiles.push(file);
      } else {
        invalidFileNames.push(file.name);
      }
    }

    // 유효하지 않은 파일이 있을 경우 에러 표시
    if (invalidFileNames.length > 0) {
      setUploadError(
        `지원하지 않는 파일 형식(${invalidFileNames.join(", ")})은(는) 제외되었습니다.`
      );
      if (validFiles.length === 0) return; // 유효한 파일이 없으면 여기서 중단
    }

    const fileURLs: string[] = [];
    let isVideoPresent = false;
    let videoLengthError = false;
    let newVideoDuration = 0;

    const newFiles = await Promise.all(
      validFiles.map(async (file) => {
        let dims = { width: 0, height: 0 };
        let duration: number | undefined;
        const fileURL = URL.createObjectURL(file);
        fileURLs.push(fileURL);

        try {
          if (file.type.startsWith("image/")) {
            dims = await getImageDimensions(file);
          } else if (file.type.startsWith("video/")) {
            isVideoPresent = true;
            const videoElement = document.createElement("video");
            videoElement.src = fileURL;
            await new Promise((resolve) => {
              videoElement.onloadedmetadata = () => {
                duration = videoElement.duration;
                newVideoDuration = duration;
                if (duration > 60) videoLengthError = true;
                resolve(true);
              };
              videoElement.onerror = () => resolve(false);
            });
            dims = await getVideoDimensions(file);
          }
        } catch (err) {
          console.warn(`Could not read dimensions...`, err);
        }
        return {
          fileOrigin: file,
          name: file.name,
          size: file.size,
          type: file.type,
          width: dims.width,
          height: dims.height,
          videoDuration: duration,
        };
      })
    );

    if (isVideoPresent) {
      if (videoLengthError) {
        setUploadError(
          `영상 길이는 60초를 초과할 수 없습니다. (현재 ${newVideoDuration.toFixed(1)} 초.)`
        );
        setFiles([]);
        setPreviews([]);
        setVideoUploaded(false);
      } else {
        setFiles([newFiles[0]]);
        setPreviews([fileURLs[0]]);
        setVideoUploaded(true);
      }
    } else {
      setFiles((prev) => [...prev, ...newFiles].slice(0, 100));
      setPreviews((prev) => [...prev, ...fileURLs].slice(0, 100));
    }
  };

  // 파일 선택 핸들러 (기존과 동일)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    handleFiles(Array.from(selectedFiles));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // [수정] 전체 초기화 (태그 로직 수정)
  const clearAll = () => {
    setFiles([]);
    setPreviews([]);
    setVideoUploaded(false);
    setUploadError(null);
    setTitle("");
    setDescription("");
    setTags([]); // 선택된 태그 초기화
    setIsAlbum(false);
  };

  // 단일 파일 제거 (기존과 동일)
  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
    setUploadError(null);
    if (videoUploaded && updatedFiles.length === 0) {
      setVideoUploaded(false);
    }

    // 파일이 2개 미만이 되면 앨범 체크 해제
    if (updatedFiles.length < 2) {
      setIsAlbum(false);
    }
  };

  // [신규] 2. 태그 토글 핸들러
  const handleToggleTag = (tagToToggle: string) => {
    setTags(
      (prev) =>
        prev.includes(tagToToggle)
          ? prev.filter((tag) => tag !== tagToToggle) // 이미 있으면 제거
          : [...prev, tagToToggle] // 없으면 추가
    );
  };

  // [수정] 3. 선택된 태그 제거 핸들러 (이름 통일)
  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  // 업로드 핸들러 (기존과 동일)
  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadError("업로드할 파일을 선택하세요.");
      return;
    }
    if (!title.trim()) {
      setUploadError("제목을 입력하세요.");
      return;
    }
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("data", file.fileOrigin);
      formData.append(
        "metadata",
        JSON.stringify({
          name: file.name,
          size: file.size,
          type: file.type,
          width: file.width,
          height: file.height,
          videoDuration: file.videoDuration,
        })
      );
    });
    formData.append("title", title);
    formData.append("description", description);
    formData.append("tags", JSON.stringify(tags));
    formData.append("isAlbum", String(isAlbum));

    // const res = { success: true }; // 테스트용
    const res = await uploadFileAPI(formData);

    if (res.success) {
      alert("업로드 성공!");
      clearAll();
    } else {
      setUploadError((res as any).message || "업로드 실패.");
    }
  };

  return (
    <main className="w-full min-h-[calc(100vh-56px)] px-5">
      <div className="container mx-auto py-5">
        <div className="flex w-full max-w-3xl mx-auto flex-col overflow-hidden rounded-xl bg-white p-6 md:p-8 gap-6">
          <h1 className="text-3xl font-bold text-center text-gray-900">새 게시물 만들기</h1>

          {/* 드롭존 */}
          <DropZone
            onFilesSelected={handleFiles}
            videoUploaded={videoUploaded}
            clearAll={clearAll}
            currentCount={files.length}
          >
            {({ isDragging, rootProps }) => (
              <div
                {...rootProps}
                className={`w-full min-h-[200px] p-6 text-center border-2 border-dashed rounded-xl ...
                  ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50"}
                `}
              >
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2 text-lg font-semibold text-gray-500">
                  여기에 사진이나 동영상을 끌어다 놓으세요.
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  최대 60초 길이의 영상 / 파일당 200MB 이하
                </p>
                <label
                  htmlFor="fileInput"
                  className="inline-block px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  파일 선택
                </label>
                <input
                  type="file"
                  multiple={!videoUploaded}
                  accept="image/*,video/*"
                  className="hidden"
                  id="fileInput"
                  onChange={handleFileChange}
                  disabled={videoUploaded}
                  ref={fileInputRef}
                />
              </div>
            )}
          </DropZone>

          {/* 업로드 실패 메시지 */}
          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg">
              <AlertCircle size={20} />
              <p className="text-sm">{uploadError}</p>
            </div>
          )}

          {/* 미리보기 헤더 */}
          {previews.length > 0 && (
            <div className="flex justify-between items-center -mb-2">
              <span className="text-sm font-semibold text-gray-700">
                {videoUploaded ? "동영상 1개" : `이미지 ${files.length}개`}
              </span>
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors"
              >
                전체 삭제
              </button>
            </div>
          )}

          {/* 미리보기 스크롤 그리드 */}
          {previews.length > 0 && (
            <div className="w-full max-h-[400px] overflow-y-auto rounded-lg border border-gray-200 p-2 custom-scrollbar">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-300"
                  >
                    {files[index].type.startsWith("image/") ? (
                      <Image
                        src={preview}
                        alt="preview"
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <video
                        src={preview}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                    )}
                    <button
                      className="absolute top-1 right-1 bg-red-500 bg-opacity-70 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 묶음으로 업로드 체크박스 */}
          {files.length > 0 && !videoUploaded && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="isAlbumCheckbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:bg-gray-200"
                checked={isAlbum}
                onChange={(e) => setIsAlbum(e.target.checked)}
                disabled={files.length < 2 || videoUploaded}
              />
              <label
                htmlFor="isAlbumCheckbox"
                className={`text-sm font-medium ${
                  files.length < 2 || videoUploaded
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 cursor-pointer"
                }`}
              >
                묶음으로 업로드 (앨범 생성)
              </label>
            </div>
          )}

          {/*  폼 필드 */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col">
              <label htmlFor="title" className="text-lg font-semibold mb-2 text-gray-800">
                제목
              </label>
              <input
                id="title"
                type="text"
                placeholder="게시물 제목을 입력하세요."
                className="p-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="description" className="text-lg font-semibold mb-2 text-gray-800">
                설명
              </label>
              <textarea
                id="description"
                rows={5}
                placeholder="사진이나 영상에 대한 설명을 작성해주세요."
                className="p-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            {/* 태그 선택 섹션 */}
            <div className="flex flex-col">
              <label htmlFor="tags" className="text-lg font-semibold mb-2 text-gray-800">
                태그
              </label>

              {/* 선택된 태그 */}
              <div className="flex flex-wrap gap-2 mb-2 min-h-[30px] p-3 bg-white border border-gray-300 rounded-lg">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-blue-500 hover:text-blue-800"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-gray-400">아래에서 추천 태그를 선택하세요.</p>
                )}
              </div>

              {/* 추천 태그 */}
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                {predefinedTags.map((tag) => {
                  const isSelected = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors
                        ${
                          isSelected
                            ? "bg-blue-600 text-white" // 선택됨
                            : "bg-gray-200 text-gray-800 hover:bg-gray-300" // 선택 가능
                        }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end w-full mt-4">
            <button
              onClick={handleUpload}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              게시하기
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
