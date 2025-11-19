"use client";

import { useState } from "react";
import { isValidEmail } from "@/lib/utils";
import { forgotPasswordAPI } from "@/lib/APIs";
import Input from "@/components/ui/Input";
import LongButton from "@/components/ui/LongButton";
import LinkText from "@/components/ui/LinkText";
import { forgotPasswordRequest } from "@/lib/interfaces";

export default function Page() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">(
    "idle"
  );

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
      const request: forgotPasswordRequest = { email };
      const res = await forgotPasswordAPI(request);

      console.log("res : ", res);
      if (res.code === 200) {
        alert("해당 이메일로 재설정 링크를 발송했습니다."); // 기존 로직
      }
    } catch (error) {
      console.error("Error checking email:", error);
    }
    setEmailStatus("idle");
  };

  return (
    <div className="relative flex h-[calc(100vh-56px)] w-full flex-col items-center justify-center">
      <main className="relative z-10 flex w-full max-w-md flex-col items-center rounded-xl p-8 sm:p-10">
        <div className="mb-6 flex flex-col items-center gap-4 text-slate-800">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900">
            비밀번호 재설정
          </h1>
        </div>

        {/* 안내 문구 */}
        <p className="mb-8 text-center text-base text-slate-600">
          가입 시 사용한 이메일 주소와 닉네임을 입력해 주세요. <br />
          인증 후 비밀번호 재설정 링크를 보내드립니다.
        </p>

        {/* 폼 영역 */}
        <div className="w-full space-y-4">
          <Input
            type="email"
            label="이메일 주소"
            placeholder="your@email.com"
            value={email}
            errorMessage={emailError}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
          />

          <LongButton
            title="재설정 링크 전송"
            onClick={checkEmailAvailability}
            disabled={emailStatus === "checking"}
          />
        </div>

        {/* 로그인 링크 */}
        <p className="mt-8 text-center text-sm text-slate-600">
          비밀번호가 기억나셨나요?
          <LinkText title="로그인" href="/signin" />
        </p>
      </main>
    </div>
  );
}
