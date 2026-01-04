import { AppleLogo, GoogleLogo } from "./SvgIcons";

interface SnsLoginBtnProps {
  type: "google" | "apple";
  title: string;
}

export default function SnsLoginBtn({ type = "google", title }: SnsLoginBtnProps) {
  return (
    <button
      className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2"
      onClick={handleGoogleLoginRedirect}
    >
      {type === "google" ? <GoogleLogo /> : <AppleLogo />}
      {title}
    </button>
  );
}

const handleGoogleLoginRedirect = () => {
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const GOOGLE_REDIRECT_URL = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URL;

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URL,
    response_type: "token",
    scope: "openid profile email",
    prompt: "select_account",
  });

  // 페이지 이동 시작
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};
