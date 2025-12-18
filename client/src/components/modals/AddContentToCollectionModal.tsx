"use client";

import { useModal } from "@/contexts/ModalProvider";
import { getMyCollectionsAPI, toggleMediaItemAPI } from "@/lib/APIs";
import { AWS_BASE_URL } from "@/constants";
import { Collection, ToggleContentsReqDto } from "@/types/api-dtos";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

interface ModalProps {
  onSubmit?: (collectionName: string) => void; // 생성 버튼 클릭 시 호출될 함수
  onClose: () => void;
  mediaId?: number;
}

export const AddContentToCollectionModal: React.FC<ModalProps> = ({
  onSubmit,
  onClose,
  mediaId,
}) => {
  const { openCreateNewCollectionModal } = useModal();

  const [collectionsList, setCollecitonsList] = useState<Collection[]>([]);
  const [search, setSearch] = useState("");

  const getMyCollectionList = async () => {
    const res = await getMyCollectionsAPI(mediaId ? { mediaId } : undefined);
    console.log("### res : ", res);
    if (res.code == 200) {
      setCollecitonsList(res.data);
    }
  };

  // 선택한 컬렉션에 콘텐츠 추가
  const handleSubmit = async (collectionId: number) => {
    if (!collectionId) {
      alert("콘텐츠를 추가할 컬렉션을 선택해 주세요.");
      return;
    }

    const request: ToggleContentsReqDto = {
      collectionId,
      mediaId: mediaId ?? Number(mediaId),
    };

    const res = await toggleMediaItemAPI(request);
    if (res.code === 200) {
      alert(res.message);
      onClose();
    }
  };

  const openCreateCollectionModal = () => {
    openCreateNewCollectionModal({ mediaId });
  };

  useEffect(() => {
    getMyCollectionList();
  }, []);

  const filteredList = useMemo(() => {
    return collectionsList.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [collectionsList, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-[560px] max-h-[85vh] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">컬렉션에 저장</h2>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Search bar */}
        <div className="px-6 pt-5 pb-2">
          <div className="relative flex items-center w-full h-12 bg-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-blue-400 transition-all">
            <span className="pl-4 text-gray-400">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="컬렉션 검색..."
              className="w-full bg-transparent border-none px-3 text-gray-900 text-base focus:outline-none"
            />
          </div>
        </div>

        {/* Scroll list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scroll max-h-[360px]">
          {/* 스크롤 바 숨김처리 css */}
          <style>{`
            .custom-scroll {
                scrollbar-width: none; /* Firefox */
            }
            .custom-scroll::-webkit-scrollbar {
                display: none; /* Chrome, Safari */
            }
            @keyframes fadeIn {
                0% { opacity: 0; transform: translateY(10px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            .animate-fadeIn { animation: fadeIn .25s ease-out; }
            `}</style>
          {filteredList.map((each) => (
            <label
              key={each.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition select-none"
            >
              {/* Thumbnail */}
              <div className="relative shrink-0 size-14 rounded-lg bg-gray-200 overflow-hidden">
                {each.thumbnailKey ? (
                  <Image
                    src={AWS_BASE_URL + each.thumbnailKey}
                    alt={each.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>

              {/* Text */}
              <div className="flex flex-col flex-1 min-w-0">
                <p className="text-gray-900 font-medium truncate">{each.name}</p>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 truncate">
                  <span className="text-xs">항목 {each.itemCount}개</span>
                </div>
              </div>

              {/* Checkbox */}
              <input
                type="checkbox"
                checked={each.isContentContained}
                readOnly
                onClick={() => handleSubmit(each.id)}
                className="size-5 rounded border-2 border-gray-300 text-blue-500 focus:ring-0 cursor-pointer"
              />
            </label>
          ))}
        </div>

        {/* Create new collection */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
          <button
            className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-gray-50 transition text-left"
            onClick={openCreateCollectionModal}
          >
            <div className="flex items-center justify-center size-14 rounded-lg bg-gray-100 text-gray-400 border border-dashed border-gray-300">
              <span className="text-3xl">＋</span>
            </div>
            <span className="text-base font-medium text-gray-900">새 컬렉션 만들기</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-5 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-800 bg-gray-200 hover:bg-gray-300 transition"
          >
            취소
          </button>
        </div>
      </div>

      {/* Scrollbar styling */}
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 20px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }

        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn .25s ease-out; }
      `}</style>
    </div>
  );
};
