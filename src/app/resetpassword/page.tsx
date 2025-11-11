"use client";

import { useState } from "react";
import { isValidEmail } from "@/lib/utils";
import { resetPasswordAPI } from "@/lib/APIs";
import Link from "next/link"; // <a> 태그 대신 Next.js Link 컴포넌트 사용

export default function Page() {
  // --- 기존 State (그대로 유지) ---
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">(
    "idle"
  );

  // --- 기존 기능 로직 (그대로 유지, alert 사용) ---
  const checkEmailAvailability = async () => {
    if (!email) {
      setEmailError("이메일을 입력해 주세요");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError("유효한 이메일 주소를 입력하세요.");
      return;
    }

    setEmailStatus("checking");
    try {
      const res = await resetPasswordAPI({ email });
      console.log("res : ", res);
      if (res.code === 404) {
        alert("존재하지 않는 계정입니다."); // 기존 로직
      } else if (res.code === 200) {
        alert("해당 이메일로 재설정 링크를 발송했습니다."); // 기존 로직
      }
    } catch (error) {
      console.error("Error checking email:", error);
    }

    setEmailStatus("idle");
  };

  return (
    <div className="relative flex h-[calc(100vh-56px)] w-full flex-col items-center justify-center bg-gray-100">
      <main className="relative z-10 flex w-full max-w-md flex-col items-center rounded-xl bg-white p-8 shadow-2xl sm:p-10">
        <div className="mb-6 flex flex-col items-center gap-4 text-slate-800">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900">
            비밀번호 재설정
          </h1>
        </div>

        {/* [수정] 안내 문구 (스타일 적용) */}
        <p className="mb-8 text-center text-base text-slate-600">
          가입 시 사용한 이메일 주소와 닉네임을 입력해 주세요. <br />
          인증 후 비밀번호 재설정 링크를 보내드립니다.
        </p>

        {/* [수정] 폼 (스타일 적용) */}
        <div className="w-full space-y-4">
          <div className="w-full">
            <label className="flex flex-col">
              <p className="pb-2 text-sm font-medium leading-normal text-slate-700">이메일 주소</p>
              <input
                type="email"
                placeholder="your@email.com"
                // [수정] 로그인/회원가입과 동일한 input 스타일
                className={`form-input h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border p-3 text-base font-normal placeholder:text-slate-400 focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                  ${
                    emailError
                      ? "border-red-500 focus:ring-red-500/20" // 에러
                      : "border-slate-300 bg-white text-slate-900" // 기본
                  }`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(""); // [개선] 입력 시 에러 초기화
                }}
              />
            </label>
            {/* --- 기존 에러/상태 메시지 (그대로 유지) --- */}
            {emailError && <p className="text-red-500 text-sm mt-1">❌ {emailError}</p>}
            {emailStatus === "available" && (
              <p className="text-green-500 text-sm mt-1">✅ Email is available</p>
            )}
            {emailStatus === "taken" && (
              <p className="text-red-500 text-sm mt-1">❌ Email is already taken</p>
            )}
          </div>

          <button
            className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={checkEmailAvailability}
            disabled={emailStatus === "checking"} // [개선] 로딩 중 비활성화
          >
            비밀번호 재설정 링크 전송
          </button>
        </div>

        {/* [수정] 로그인 링크 (스타일 적용 및 <Link> 태그 사용) */}
        <p className="mt-8 text-center text-sm text-slate-600">
          비밀번호가 기억나셨나요?
          <Link className="font-semibold text-[#5A9CFF] hover:text-blue-400" href="/signin">
            &nbsp;로그인
          </Link>
        </p>
      </main>
    </div>
  );
}
