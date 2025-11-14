import { Star } from "lucide-react";

interface Props {
  isCollected: boolean;
}

export function AddToCollectionBtn({ isCollected = false }: Props) {
  return (
    <button
      onClick={() => {
        //추후 컬렉션에 추가 API 추가하기
      }}
      className={`flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors
        ${
          isCollected
            ? "border-yellow-500 bg-yellow-500 text-white"
            : "border-gray-300 text-gray-700 hover:bg-gray-100"
        }`}
    >
      <Star size={20} fill={isCollected ? "currentColor" : "none"} strokeWidth={1.5} />
    </button>
  );
}
