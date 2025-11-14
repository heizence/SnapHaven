import { Heart } from "lucide-react";

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
