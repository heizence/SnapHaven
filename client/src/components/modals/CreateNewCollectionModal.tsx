"use client";

import { createNewCollectionAPI } from "@/lib/APIs";
import React, { useState } from "react";

interface ModalProps {
  onSubmit?: (collectionName: string) => void; // 생성 버튼 클릭 시 호출될 함수
  onClose: () => void;
  mediaId: number;
}

export const CreateNewCollectionModal: React.FC<ModalProps> = ({ onSubmit, onClose, mediaId }) => {
  const [collectionName, setCollectionName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionName.trim()) return;

    if (collectionName.length > 30) {
      setError("컬렉션 이름은 30자 이하여야 합니다.");
      return;
    }

    try {
      const request = {
        name: collectionName,
        mediaId: Number(mediaId),
      };

      const res = await createNewCollectionAPI(request);
      if (res.code === 201) {
        alert("콘텐츠가 컬렉션에 추가되었습니다.");
        onClose();
      }
    } catch (error) {
      alert(error.message || "에러가 발생했습니다.");
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-xl font-bold text-gray-900">새 컬렉션 추가</h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="collectionName" className="block text-sm font-medium text-gray-700">
              컬렉션 이름
            </label>
            <input
              id="collectionName"
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="예) 여름 휴가 사진 모음"
              className={`mt-1 block w-full rounded-lg border p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? "border-red-500 focus:ring-red-500" : "border-gray-300"
              }`}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>

          {/* 버튼 그룹 */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!collectionName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              생성
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
