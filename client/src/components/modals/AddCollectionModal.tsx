"use client";

import React, { useState } from "react";

interface AddCollectionModalProps {
  onClose: () => void;
  onSubmit: (collectionName: string) => void; // 생성 버튼 클릭 시 호출될 함수
  error?: string | null; // 부모로부터 받은 에러 메시지
  isLoading?: boolean; // 생성 중 로딩 상태
}

export const AddCollectionModal: React.FC<AddCollectionModalProps> = ({
  onClose,
  onSubmit,
  error,
  isLoading,
}) => {
  const [collectionName, setCollectionName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !collectionName.trim()) return;
    onSubmit(collectionName);
  };

  return (
    // 1. Backdrop (배경)
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    >
      {/* 2. Modal Card (본체) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        {/* 닫기 버튼 (숨겨져 있음 - 필요 시 활성화) */}
        {/*
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        */}

        <h2 className="text-xl font-bold text-gray-900">새 컬렉션 추가</h2>

        {/* 3. 폼 */}
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
              placeholder="내 여름 휴가 앨범"
              className={`mt-1 block w-full rounded-lg border p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? "border-red-500 focus:ring-red-500" : "border-gray-300"
              }`}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>

          {/* 4. 버튼 그룹 */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || !collectionName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "생성 중..." : "생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/*
  --- 사용 예시 ---

  const [showAddModal, setShowAddModal] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateCollection = async (name: string) => {
    setIsLoading(true);
    setApiError(null);
    
    // (API 호출 시뮬레이션)
    await new Promise(r => setTimeout(r, 1000));
    if (name === "중복이름") {
      setApiError("이미 사용 중인 이름입니다.");
      setIsLoading(false);
    } else {
      setShowAddModal(false);
      setIsLoading(false);
      // (성공 로직... 예: 목록 새로고침)
    }
  };

  {showAddModal && (
    <AddCollectionModal
      onClose={() => setShowAddModal(false)}
      onSubmit={handleCreateCollection}
      error={apiError}
      isLoading={isLoading}
    />
  )}
*/
