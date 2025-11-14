import { Download } from "lucide-react";

interface Props {
  title?: string;
  onClick: () => void;
}

export function DownloadBtn({ title = "다운로드", onClick }: Props) {
  return (
    <button
      className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-600"
      onClick={onClick}
    >
      <Download size={20} />
      <span>{title}</span>
    </button>
  );
}
