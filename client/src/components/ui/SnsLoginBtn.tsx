import { AppleLogo, GoogleLogo } from "./SvgIcons";

interface SnsLoginBtnProps {
  type: "google" | "apple";
  title: string;
  onClick: () => void;
}

export default function SnsLoginBtn({ type = "google", title, onClick }: SnsLoginBtnProps) {
  return (
    <button
      className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2"
      onClick={onClick}
    >
      {type === "google" ? <GoogleLogo /> : <AppleLogo />}
      {title}
    </button>
  );
}
