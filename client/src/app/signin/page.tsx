"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hashString, isValidEmail } from "@/lib/utils";
import Input from "@/components/ui/Input";
import LongButton from "@/components/ui/LongButton";
import SnsLoginBtn from "@/components/ui/SnsLoginBtn";
import LinkText from "@/components/ui/LinkText";
import { signinAPI } from "@/lib/APIs";

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

      if (res.code === 404) {
        setEmailError("이메일 또는 비밀번호를 다시 확인해 주세요.");
        setPasswordError(" ");
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
    <div className="relative flex w-full h-full flex-col items-center justify-center py-5">
      <main className="relative z-10 flex w-full max-w-md flex-col items-center rounded-xl bg-white p-8 sm:p-10">
        <div className="mb-6 flex flex-col items-center gap-4 text-slate-800 ">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 ">
            로그인
          </h1>
        </div>
        <p className="mb-6 text-base text-slate-600 ">다시 만나서 반가워요!</p>

        {/* 폼 영역 */}
        <div className="w-full space-y-4">
          {/* 이메일 입력 */}
          <Input
            type="email"
            label="이메일 주소"
            placeholder="your@email.com"
            value={email}
            errorMessage={emailError}
            onChange={(e) => {
              typeEmail(e.target.value);
            }}
          />
          {/* 비밀번호 입력 */}
          <Input
            type={"password"}
            label="비밀번호"
            placeholder="8자 이상 입력해 주세요"
            value={password}
            showPassword={showPassword}
            errorMessage={passwordError}
            onChange={(e) => typePassword(e.target.value)}
            togglePasswordVisibility={togglePasswordVisibility}
          />
          {/* 비밀번호 재설정 링크 */}
          <div className="flex justify-end">
            <p className="text-center text-sm text-slate-600">
              <LinkText title="비밀번호 재설정" href="/resetpassword" />
            </p>
          </div>

          {/* 로그인 버튼 */}
          <LongButton title="로그인" onClick={signin} disabled={emailStatus === "checking"} />
        </div>

        {/* '또는' 구분선 */}
        <div className="relative my-6 w-full">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white/80 px-2 text-slate-500 backdrop-blur-lg">또는</span>
          </div>
        </div>

        {/* SNS 로그인 버튼 */}
        <div className="w-full space-y-3">
          <SnsLoginBtn
            type="google"
            title="Google 계정으로 로그인"
            onClick={() => alert("Google 로그인 API 연동 필요")}
          />
          <SnsLoginBtn
            type="apple"
            title="Apple 계정으로 로그인"
            onClick={() => alert("Apple 로그인 API 연동 필요")}
          />
        </div>

        {/* 회원가입 링크 */}
        <p className="mt-8 text-center text-sm text-slate-600">
          아직 회원이 아니신가요?
          <LinkText title="회원가입" href="/signup" />
        </p>
      </main>
    </div>
  );
}
