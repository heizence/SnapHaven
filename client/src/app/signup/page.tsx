"use client";

import { useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import LongButton from "@/components/ui/LongButton";
import SnsLoginBtn from "@/components/ui/SnsLoginBtn";
import LinkText from "@/components/ui/LinkText";
import {
  signupAPI,
  checkNicknameAPI,
  requestEmailVerificationAPI,
  verifyCodeAPI,
} from "@/lib/APIs";
import { isValidPassword } from "@/lib/utils";
import { useLoading } from "@/contexts/LoadingProvider";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);

  // UI 및 에러 상태 관리
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "sent" | "verified" | "error"
  >("idle");
  const [emailMessage, setEmailMessage] = useState("");
  const [nicknameStatus, setNicknameStatus] = useState<"idle" | "checking" | "ok" | "error">(
    "idle"
  );
  const [nicknameMessage, setNicknameMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");
  const [termsError, setTermsError] = useState("");

  const [formStatus, setFormStatus] = useState<"idle" | "submitting">("idle");
  const { showLoading, hideLoading } = useLoading();

  // --- 이메일 인증 로직 ---
  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      setEmailStatus("error");
      setEmailMessage("올바른 이메일 형식을 입력해주세요.");
      return;
    }
    setEmailStatus("sending");
    showLoading();
    const res = await requestEmailVerificationAPI({ email });
    if (res.code === 200) {
      setEmailStatus("sent");
      alert("인증번호가 전송되었습니다.");
    } else {
      setEmailStatus("error");
      setEmailMessage(res.message || "전송에 실패했습니다.");
    }
    hideLoading();
  };

  const handleVerifyCode = async () => {
    showLoading();
    const res = await verifyCodeAPI({ email, code: verificationCode });
    if (res.code === 200) {
      setEmailStatus("verified");
      setEmailMessage("이메일 인증이 완료되었습니다.");
    } else {
      setEmailMessage("인증번호가 일치하지 않습니다.");
    }
    hideLoading();
  };

  // --- 닉네임 중복 체크 ---
  const handleCheckNickname = async () => {
    if (!nickname) {
      setNicknameStatus("error");
      setNicknameMessage("닉네임을 입력해주세요.");
      return;
    }
    setNicknameStatus("checking");
    showLoading();
    const res = await checkNicknameAPI({ nickname });
    if (res.code === 200) {
      setNicknameStatus("ok");
      setNicknameMessage(res.message);
    } else {
      setNicknameStatus("error");
      setNicknameMessage(res.message);
    }
    hideLoading();
  };

  // --- 비밀번호 강도 체크 ---
  const checkPasswordStrength = (pass: string) => {
    setPassword(pass);
    setPasswordError("");
    if (pass.length === 0) setPasswordStrength(0);
    else if (pass.length < 8) setPasswordStrength(1);
    else if (pass.length < 12 || !/\d/.test(pass) || !/[a-zA-Z]/.test(pass)) setPasswordStrength(2);
    else setPasswordStrength(3);
  };

  const getPasswordStrengthClasses = () => {
    switch (passwordStrength) {
      case 1:
        return { bar: "w-1/4 bg-red-500", text: "약함", color: "text-red-500" };
      case 2:
        return { bar: "w-1/2 bg-yellow-500", text: "중간", color: "text-yellow-500" };
      case 3:
        return { bar: "w-full bg-green-500", text: "강함", color: "text-green-500" };
      default:
        return { bar: "", text: "", color: "" };
    }
  };
  const strength = getPasswordStrengthClasses();

  // --- 최종 가입 제출 ---
  const handleSubmit = async () => {
    if (emailStatus !== "verified") {
      setEmailStatus("error");
      setEmailMessage("이메일 인증을 완료해주세요.");
      return;
    }
    if (nicknameStatus !== "ok") {
      setNicknameStatus("error");
      setNicknameMessage("닉네임 중복 확인을 완료해주세요.");
      return;
    }
    if (!isValidPassword(password)) {
      setPasswordError("비밀번호는 8자 이상이고 영문, 숫자, 특수문자를 포함해야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      setPasswordConfirmError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!termsChecked) {
      setTermsError("약관에 동의해주세요.");
      return;
    }

    setFormStatus("submitting");
    const res = await signupAPI({ email, password, nickname });
    if (res.code === 201) {
      alert("회원가입이 완료되었습니다.");
      window.location.href = "/signin";
    } else {
      setFormStatus("idle");
    }
  };

  return (
    <div className="relative flex w-full h-full flex-col items-center justify-center py-5">
      <main className="relative z-10 flex w-full max-w-md flex-col items-center rounded-xl sm:p-10">
        <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          회원가입
        </h1>
        <p className="mb-6 text-base text-slate-600">SnapHaven에 오신 것을 환영합니다!</p>

        <div className="flex w-full flex-col gap-4">
          {/* 1. 이메일 입력 섹션 */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-700">이메일 주소</p>
            <div className="flex w-full items-stretch">
              <input
                className={`form-input h-12 w-full rounded-l-lg border p-3 text-base focus:z-10 focus:outline-0 focus:ring-2 
                  ${
                    emailStatus === "error"
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-slate-300"
                  }`}
                placeholder="your@email.com"
                value={email}
                disabled={emailStatus === "verified"}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailStatus("idle");
                }}
              />
              <button
                className="flex h-12 flex-shrink-0 items-center justify-center rounded-r-lg border border-l-0 border-slate-300 px-4 text-sm font-medium text-blue-500 hover:bg-slate-100 disabled:text-slate-400"
                onClick={handleSendCode}
                disabled={emailStatus === "sending" || emailStatus === "verified"}
              >
                {emailStatus === "sending"
                  ? "전송 중"
                  : emailStatus === "sent"
                  ? "재전송"
                  : "인증 요청"}
              </button>
            </div>
          </div>

          {/* 2. 인증코드 입력 섹션 (전송 후에만 노출) */}
          {(emailStatus === "sent" || emailStatus === "verified") && (
            <div className="flex flex-col gap-2">
              <div className="flex w-full items-stretch">
                <input
                  className="form-input h-12 w-full rounded-l-lg border border-slate-300 p-3 text-base focus:z-10 focus:outline-0 focus:ring-2 focus:ring-primary/20"
                  placeholder="인증번호 6자리"
                  value={verificationCode}
                  disabled={emailStatus === "verified"}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
                <button
                  className="flex h-12 flex-shrink-0 items-center justify-center rounded-r-lg border border-l-0 border-slate-300 bg-blue-500 px-6 text-sm font-medium text-white hover:bg-blue-600 disabled:bg-slate-400"
                  onClick={handleVerifyCode}
                  disabled={emailStatus === "verified"}
                >
                  확인
                </button>
              </div>
            </div>
          )}
          {emailMessage && (
            <p
              className={`text-sm ${
                emailStatus === "verified" ? "text-green-600" : "text-red-500"
              }`}
            >
              {emailStatus === "verified" ? "✅" : "❌"} {emailMessage}
            </p>
          )}

          {/* 3. 닉네임 섹션 */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-700">닉네임</p>
            <div className="flex w-full items-stretch">
              <input
                className={`form-input h-12 w-full rounded-l-lg border p-3 text-base focus:z-10 focus:outline-0 focus:ring-2 
                  ${
                    nicknameStatus === "error"
                      ? "border-red-500 focus:ring-red-500/20"
                      : "border-slate-300"
                  }`}
                placeholder="사용하실 닉네임"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setNicknameStatus("idle");
                }}
              />
              <button
                className="flex h-12 flex-shrink-0 items-center justify-center rounded-r-lg border border-l-0 border-slate-300 px-4 text-sm font-medium text-blue-500 hover:bg-slate-100"
                onClick={handleCheckNickname}
                disabled={nicknameStatus === "checking"}
              >
                중복 확인
              </button>
            </div>
            {nicknameMessage && (
              <p
                className={`text-sm ${nicknameStatus === "ok" ? "text-green-600" : "text-red-500"}`}
              >
                {nicknameStatus === "ok" ? "✅" : "❌"} {nicknameMessage}
              </p>
            )}
          </div>

          {/* 4. 비밀번호 섹션 */}
          <div className="flex flex-col gap-3">
            <Input
              type="password"
              label="비밀번호"
              placeholder="8자 이상, 영문/숫자/특수문자 포함"
              value={password}
              showPassword={showPassword}
              errorMessage={passwordError}
              onChange={(e) => checkPasswordStrength(e.target.value)}
              togglePasswordVisibility={() => setShowPassword(!showPassword)}
            />
            {password.length > 0 && (
              <div className="flex flex-col gap-2 px-1">
                <div className="h-1.5 w-full rounded-full bg-slate-200">
                  <div className={`h-1.5 rounded-full transition-all ${strength.bar}`}></div>
                </div>
                <p className={`text-xs font-medium ${strength.color}`}>
                  비밀번호 강도: {strength.text}
                </p>
              </div>
            )}
          </div>

          <Input
            type="password"
            label="비밀번호 확인"
            placeholder="비밀번호를 다시 입력해주세요"
            value={passwordConfirm}
            showPassword={showPasswordConfirm}
            errorMessage={passwordConfirmError}
            onChange={(e) => {
              setPasswordConfirm(e.target.value);
              setPasswordConfirmError("");
            }}
            togglePasswordVisibility={() => setShowPasswordConfirm(!showPasswordConfirm)}
          />

          {/* 5. 약관 및 가입 버튼 */}
          <div className="flex flex-col gap-1 pt-2">
            <div className="flex items-center space-x-2">
              <input
                className="h-4 w-4 rounded border-slate-300 text-primary"
                id="terms"
                type="checkbox"
                checked={termsChecked}
                onChange={(e) => setTermsChecked(e.target.checked)}
              />
              <label className="text-sm font-medium text-slate-600" htmlFor="terms">
                <Link className="font-semibold text-[#5A9CFF] hover:underline" href="/terms">
                  이용약관
                </Link>{" "}
                및{" "}
                <Link className="font-semibold text-[#5A9CFF] hover:underline" href="/privacy">
                  개인정보 처리방침
                </Link>
                에 동의합니다.
              </label>
            </div>
            {termsError && <p className="text-red-500 text-sm mt-1">❌ {termsError}</p>}
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <LongButton
              title="이메일로 가입하기"
              onClick={handleSubmit}
              disabled={formStatus === "submitting"}
            />

            {/* 항상 표시되는 SNS 섹션 */}
            <div className="relative my-2 w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white/80 px-2 text-slate-500">또는</span>
              </div>
            </div>

            <div className="w-full space-y-3">
              <SnsLoginBtn
                type="google"
                title="Google로 계속하기"
                onClick={() => {
                  /* SNS 로직 */
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-600">
          <span>이미 계정이 있으신가요?</span>
          <LinkText title="로그인" href="/signin" />
        </div>
      </main>
    </div>
  );
}
