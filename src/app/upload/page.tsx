"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import Image from "next/image";

export default function Page() {
  const [files, setFiles] = useState<File[]>([]);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    const fileURLs: string[] = [];

    newFiles.forEach((file) => {
      const fileURL = URL.createObjectURL(file);
      fileURLs.push(fileURL);
    });

    // 동영상 포함 여부 확인
    if (newFiles.some((file) => file.type.startsWith("video/"))) {
      setFiles([newFiles[0]]);
      setPreviews([fileURLs[0]]);
      setVideoUploaded(true);
    } else if (!videoUploaded) {
      setFiles((prev) => [...prev, ...newFiles].slice(0, 100));
      setPreviews((prev) => [...prev, ...fileURLs].slice(0, 100));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));

    if (videoUploaded) {
      setVideoUploaded(false);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("업로드할 파일을 선택하세요.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      alert("업로드 성공!");
      setFiles([]);
      setPreviews([]);
      setVideoUploaded(false);
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

      <div className="w-full max-w-2xl p-6 mt-6 text-center border-2 border-dashed rounded-lg bg-gray-50">
        <Upload className="w-12 h-12 mx-auto text-gray-400" />
        <p className="mt-2 text-lg font-semibold">파일을 끌어다 놓거나 클릭하여 업로드</p>

        <input
          type="file"
          multiple={!videoUploaded}
          accept="image/*, video/*"
          className="hidden"
          id="fileInput"
          onChange={handleFileChange}
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
            onClick={() => {
              setFiles([]);
              setPreviews([]);
              setVideoUploaded(false);
            }}
          >
            전체 삭제
          </button>
        )}

        <p className="mt-2 text-sm text-gray-500">
          {videoUploaded
            ? "동영상 1개 업로드됨. 추가 파일 업로드 불가"
            : `현재 파일 개수: ${files.length}개`}
        </p>
      </div>

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
              <video src={preview} controls className="w-full max-w-[600px] rounded-lg shadow-md" />
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

      <button onClick={handleUpload} className="px-4 py-2 mt-6 text-white bg-blue-600 rounded-lg">
        Upload
      </button>
    </div>
  );
}
