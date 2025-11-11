"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { hashString, isValidEmail } from "@/lib/utils";
import { signinAPI } from "@/lib/APIs";
import { AppleLogo, GoogleLogo } from "@/components/ui/SvgIcons";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking">("idle");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const typeEmail = (value: string) => {
    setEmail(value);
    setEmailError("");
  };

  const typePassword = (value: string) => {
    setPassword(value);
    setPasswordError("");
  };

  // 로그인 API 호출 로직 (기존과 동일)
  const signin = async () => {
    if (!email) {
      setEmailError("이메일을 입력해 주세요");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError("유효한 이메일 주소를 입력하세요.");
      return;
    }
    if (!password) {
      setPasswordError("비밀번호를 입력하세요.");
      return; // password가 비어있을 때 signinAPI가 호출되지 않도록 수정
    }

    setEmailStatus("checking");
    try {
      console.log("signin password : ", password);
      // [보안 참고]
      // 비밀번호 해싱은 '클라이언트'가 아닌 '백엔드(NestJS)'에서 수행하는 것이
      // 훨씬 더 안전합니다. 지금은 기존 로직을 그대로 유지합니다.
      const hashedPassword = await hashString(password);

      const res = await signinAPI({ email, password: hashedPassword });
      console.log("signin res : ", res);

      if (res.code === 404) {
        // alert() 대신 에러 메시지를 표시하도록 수정
        setEmailError("이메일 또는 비밀번호를 다시 확인해 주세요.");
        setPasswordError(" "); // 비밀번호 에러 필드도 활성화 (메시지 없이)
      } else if (res.code === 200) {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Error checking email:", error);
      setPasswordError("로그인 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
    setEmailStatus("idle");
  };

  return (
    // 1. 전체 화면 배경 (템플릿 구조)
    <div className="relative flex h-[calc(100vh-60px)] w-full flex-col items-center justify-center bg-gray-100">
      {/* 1-2. 메인 로그인 카드 (템플릿 구조) */}
      <main className="relative z-10 flex w-full max-w-md flex-col items-center rounded-xl bg-white p-8 shadow-2xl sm:p-10">
        {/* 2. 로고 및 헤더 (템플릿 구조) */}
        <div className="mb-6 flex flex-col items-center gap-4 text-slate-800 ">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 ">
            로그인
          </h1>
        </div>
        <p className="mb-6 text-base text-slate-600 ">다시 만나서 반가워요!</p>

        {/* 3. 폼 영역 (기능 통합) */}
        <div className="w-full space-y-4">
          {/* 3-1. 이메일 입력 */}
          <div className="w-full">
            <label className="flex flex-col">
              <p className="pb-2 text-sm font-medium leading-normal text-slate-700">이메일 주소</p>
              <input
                className={`form-input h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border p-3 text-base font-normal leading-normal placeholder:text-slate-400 focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                  ${
                    emailError
                      ? "border-red-500 focus:ring-red-500/20" // 에러 상태 스타일
                      : "border-slate-300 bg-white text-slate-900" // 기본 상태 스타일
                  }`}
                placeholder="your@email.com"
                type="email"
                value={email} // [기능 연결]
                onChange={(e) => typeEmail(e.target.value)} // [기능 연결]
              />
            </label>
            {/* [기능 연결] 에러 메시지 표시 */}
            {emailError && <p className="text-red-500 text-sm mt-1">❌ {emailError}</p>}
          </div>

          {/* 3-2. 비밀번호 입력 */}
          <div className="w-full">
            <label className="flex flex-col">
              <p className="pb-2 text-sm font-medium leading-normal text-slate-700">비밀번호</p>
              {/* [기능 추가] 비밀번호 토글을 위해 relative 컨테이너 추가 */}
              <div className="relative w-full">
                <input
                  className={`form-input h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border p-3 text-base font-normal leading-normal placeholder:text-slate-400 focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                    ${
                      passwordError
                        ? "border-red-500 focus:ring-red-500/20" // 에러 상태 스타일
                        : "border-slate-300 bg-white text-slate-900" // 기본 상태 스타일
                    }`}
                  placeholder="8자 이상 입력해 주세요"
                  type={showPassword ? "text" : "password"} // [기능 연결]
                  value={password} // [기능 연결]
                  onChange={(e) => typePassword(e.target.value)} // [기능 연결]
                />
                {/* [기능 추가] 비밀번호 토글 버튼 (기존 코드에서 가져옴) */}
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </label>
            {/* [기능 연결] 에러 메시지 표시 */}
            {passwordError && passwordError.trim() && (
              <p className="text-red-500 text-sm mt-1">❌ {passwordError}</p>
            )}
          </div>

          {/* 3-3. 비밀번호 재설정 링크 (Next.js Link로 변경) */}
          <div className="flex justify-end">
            <Link
              className="text-sm font-medium leading-normal text-[#5A9CFF] hover:underline"
              href="/resetpassword"
            >
              비밀번호 재설정
            </Link>
          </div>

          {/* 3-4. 로그인 버튼 (기능 연결) */}
          <button
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2 
            disabled:opacity-50 disabled:cursor-not-allowed" // [기능 추가] 비활성화 스타일
            onClick={signin} // [기능 연결]
            disabled={emailStatus === "checking"} // [기능 연결]
          >
            {/* [기능 추가] 로딩 상태 표시 */}
            {emailStatus === "checking" ? "로그인 중..." : "로그인"}
          </button>
        </div>

        {/* 4. '또는' 구분선 (템플릿 구조) */}
        <div className="relative my-6 w-full">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white/80 px-2 text-slate-500 backdrop-blur-lg">또는</span>
          </div>
        </div>

        {/* 5. SNS 로그인 버튼 (템플릿 구조 + 기능 연결) */}
        <div className="w-full space-y-3">
          <button
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2"
            onClick={() => alert("Google 로그인 API 연동 필요")}
          >
            <GoogleLogo />
            Google 계정으로 로그인
          </button>
          <button
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2"
            onClick={() => alert("Apple 로그인 API 연동 필요")} // [기능 연결] (임시)
          >
            <AppleLogo />
            Apple 계정으로 로그인
          </button>
        </div>

        {/* 6. 회원가입 링크 (Next.js Link로 변경) */}
        <p className="mt-8 text-center text-sm text-slate-600">
          아직 회원이 아니신가요?
          <Link className="font-semibold text-[#5A9CFF] hover:underline" href="/signup">
            &nbsp;회원가입
          </Link>
        </p>
      </main>
    </div>
  );
}
