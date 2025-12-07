"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  isLiked: boolean;
}

export function LikeButton({ isLiked = false }: Props) {
  return (
    <button
      onClick={() => {
        // 좋아요 처리 API 추가
      }}
      className={`flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors
        ${
          isLiked
            ? "border-red-500 bg-red-500 text-white"
            : "border-gray-300 text-gray-700 hover:bg-gray-100"
        }`}
    >
      <Heart size={20} fill={isLiked ? "currentColor" : "none"} strokeWidth={1.5} />
    </button>
  );
}

export function LikeButtonForFeeds({ isLiked = false }: { isLiked: boolean }) {
  const [_isLiked, setIsLiked] = useState(isLiked);

  const toggleLike = (e) => {
    e.stopPropagation();
    setIsLiked((prev) => !prev);

    // 추후 좋아요 처리 API 추가하기
  };

  useEffect(() => {
    setIsLiked(false);
  }, []);

  return (
    <button onClick={(e) => toggleLike(e)}>
      <Heart size={22} fill={_isLiked ? "red" : "none"} strokeWidth={_isLiked ? 0 : 1.5} />
    </button>
  );
}
