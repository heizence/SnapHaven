"use client";

import { toggleLikedItemAPI } from "@/lib/APIs";
import { ToogleLikedReqDto } from "@/types/api-dtos";

import { Heart } from "lucide-react";
import { useState } from "react";

interface Props {
  isLiked: boolean;
  mediaItemId: number;
}

export function LikeButton({ isLiked = false, mediaItemId }: Props) {
  const [_isLiked, setIsLiked] = useState(isLiked);
  const toggleLiked = async (e) => {
    e.stopPropagation();

    const request: ToogleLikedReqDto = {
      mediaId: mediaItemId,
    };
    const res = await toggleLikedItemAPI(request);
    if (res.code === 201) {
      setIsLiked((prev) => !prev);
    }
  };

  return (
    <button
      onClick={(e) => {
        toggleLiked(e);
      }}
      className={`flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors
        ${"border-gray-300 text-gray-700 hover:bg-gray-100"}`}
    >
      <Heart size={20} fill={_isLiked ? "red" : "none"} strokeWidth={_isLiked ? 0 : 1.5} />
    </button>
  );
}

export function LikeButtonForFeeds({ isLiked = false, mediaItemId }: Props) {
  const [_isLiked, setIsLiked] = useState(isLiked);

  const toggleLiked = async (e) => {
    e.stopPropagation();

    const res = await toggleLikedItemAPI({ mediaId: mediaItemId });
    if (res.code === 201) {
      setIsLiked((prev) => !prev);
    }
  };

  return (
    <button onClick={(e) => toggleLiked(e)}>
      <Heart size={22} fill={_isLiked ? "red" : "none"} strokeWidth={_isLiked ? 0 : 1.5} />
    </button>
  );
}
