import { useModal } from "@/contexts/ModalProvider";
import { Bookmark } from "lucide-react";

interface props {
  mediaId: number;
}

export function AddToCollectionBtn({ mediaId }: props) {
  const { openAddToCollectionModal } = useModal();

  const handleOnClick = () => {
    if (!mediaId) return;
    openAddToCollectionModal({
      onSubmit: () => {},
      mediaId,
    });
  };
  return (
    <button
      onClick={handleOnClick}
      className={`flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors
        ${
          false
            ? "border-yellow-500 bg-yellow-500 text-white"
            : "border-gray-300 text-gray-700 hover:bg-gray-100"
        }`}
    >
      <Bookmark size={20} strokeWidth={1.5} />
    </button>
  );
}
