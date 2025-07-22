"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import DropZone from "@/components/DropZone";
import { uploadFileAPI } from "@/lib/APIs";
import { getImageDimensions, getVideoDimensions } from "@/lib/utils";
import Checkbox from "@/components/ui/Checkbox";

interface FileToUpload {
  fileOrigin: File;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
}

export default function Page() {
  const [files, setFiles] = useState<FileToUpload[]>([]);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [isList, setIsList] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFiles = async (files: File[]) => {
    const fileURLs: string[] = [];

    const newFiles = await Promise.all(
      files.map(async (file) => {
        let dims = { width: 0, height: 0 };

        // just pushing fileURL for preivew
        const fileURL = URL.createObjectURL(file);
        fileURLs.push(fileURL);

        try {
          if (file.type.startsWith("image/")) {
            dims = await getImageDimensions(file);
          } else if (file.type.startsWith("video/")) {
            dims = await getVideoDimensions(file);
          }
        } catch (err) {
          console.warn(`Could not read dimensions for ${file.name}:`, err);
        }

        return {
          fileOrigin: file,
          name: file.name,
          size: file.size,
          type: file.type,
          width: dims.width,
          height: dims.height,
        };
      })
    );

    // 동영상 포함 여부 확인
    if (newFiles.some((file) => file.type.startsWith("video/"))) {
      setFiles([newFiles[0]]);
      setPreviews([fileURLs[0]]);
      setVideoUploaded(true);
    } else {
      setFiles((prev) => [...prev, ...newFiles].slice(0, 100)); // 최대 100 개로 갯수 제한
      setPreviews((prev) => [...prev, ...fileURLs].slice(0, 100)); // 최대 100 개로 갯수 제한
    }
  };

  // for selecting files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    const newFiles = Array.from(selectedFiles);
    handleFiles(newFiles);
  };

  const clearAll = () => {
    setFiles([]);
    setPreviews([]);
    setVideoUploaded(false);
    setIsList(false);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));

    if (videoUploaded) {
      setVideoUploaded(false);
    }

    if (files.length <= 2) {
      setIsList(false);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("업로드할 파일을 선택하세요.");
      return;
    }

    const formData = new FormData();
    formData.append("isList", isList);

    files.forEach((file) => {
      formData.append("data", file.fileOrigin);
      formData.append("metadata", JSON.stringify(file));
    });

    const res = await uploadFileAPI(formData);

    console.log("res : ", res);

    if (res.success) {
      alert("업로드 성공!");
      setFiles([]);
      setPreviews([]);
      setVideoUploaded(false);
      setIsList(false);
    } else {
      alert("업로드 실패.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold text-center">사진과 동영상을 업로드하세요.</h1>
      <p className="text-gray-500">
        한 번에 최대 100개의 사진 또는 1개의 동영상을 업로드할 수 있습니다.
      </p>
      <DropZone
        onFilesSelected={handleFiles}
        videoUploaded={videoUploaded}
        clearAll={clearAll}
        currentCount={files.length}
      >
        {({ isDragging, rootProps }) => (
          <div
            {...rootProps}
            className={`
              w-full max-w-2xl p-6 mt-6 text-center border-2 border-dashed rounded-lg
              bg-gray-50 transition
              ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300"}
            `}
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400" />
            <p className="mt-2 text-lg font-semibold">파일을 끌어다 놓거나 클릭하여 업로드</p>

            <input
              type="file"
              multiple={!videoUploaded}
              accept="image/*, video/*"
              className="hidden"
              id="fileInput"
              onChange={handleFileChange}
              disabled={videoUploaded}
            />
            <label
              htmlFor="fileInput"
              className="inline-block px-4 py-2 mt-4 text-white bg-green-500 rounded-lg cursor-pointer"
            >
              파일 선택
            </label>

            {previews.length > 0 && (
              <button
                className="mb-4 ml-2 px-4 py-2 bg-red-500 text-white rounded-lg"
                onClick={clearAll}
              >
                전체 삭제
              </button>
            )}

            <div className="flex flex-col items-center">
              <p className="mt-2 mb-2 text-lm text-gray-500">
                {videoUploaded
                  ? "동영상 1개 첨부됨. 추가 파일 첨부 불가"
                  : `현재 파일 개수: ${files.length}개`}
              </p>
              <Checkbox
                label="묶음으로 업로드"
                disabled={videoUploaded || files.length < 2}
                checked={isList}
                onChange={setIsList}
              />
            </div>
          </div>
        )}
      </DropZone>

      {/* 미리보기 섹션 */}
      <div
        className={`mt-6 grid gap-4 ${
          videoUploaded
            ? "grid-cols-1"
            : files.length > 4
            ? "grid-cols-5"
            : files.length > 2
            ? "grid-cols-3"
            : "grid-cols-2"
        }`}
      >
        {previews.map((preview, index) => (
          <div key={index} className="relative">
            {files[index].type.startsWith("image/") ? (
              <Image
                src={preview}
                alt="preview"
                width={200}
                height={200}
                className="w-32 h-32 object-cover rounded-lg shadow-md"
                unoptimized
              />
            ) : (
              <video src={preview} className="w-full max-w-[600px] rounded-lg shadow-md" />
            )}
            <button
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
              onClick={() => handleRemoveFile(index)}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={handleUpload} className="px-4 py-2 mt-5 text-white bg-blue-600 rounded-lg">
        Upload
      </button>
    </div>
  );
}
