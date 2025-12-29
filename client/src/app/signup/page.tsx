"use client";

import { useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import LongButton from "@/components/ui/LongButton";
import SnsLoginBtn from "@/components/ui/SnsLoginBtn";
import LinkText from "@/components/ui/LinkText";
import { signupAPI, checkNicknameAPI } from "@/lib/APIs";
import { isValidPassword } from "@/lib/utils";
import { CheckNicknameReqDto, SignUpReqDto } from "@/types/api-dtos";
import { useLoading } from "@/contexts/LoadingProvider";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [termsChecked, setTermsChecked] = useState(false);

  // UI 상태 관리
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0); // 0: none, 1: weak, 2: mid, 3: strong

  // 에러 및 상태 메시지 관리
  const [emailError, setEmailError] = useState("");
  const [nicknameStatus, setNicknameStatus] = useState<"idle" | "checking" | "ok" | "error">(
    "idle"
  );
  const [nicknameMessage, setNicknameMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");
  const [termsError, setTermsError] = useState("");

  const [formStatus, setFormStatus] = useState<"idle" | "submitting">("idle");

  const { showLoading, hideLoading } = useLoading();

  const typeEmail = (value: string) => {
    setEmail(value);
    setEmailError("");
  };

  const typePassword = (value: string) => {
    setPassword(value);
    setPasswordError("");
    checkPasswordStrength(value);
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // 닉네임 중복 확인 핸들러
  const handleCheckNickname = async () => {
    if (!nickname) {
      setNicknameStatus("error");
      setNicknameMessage("닉네임을 입력해주세요.");
      return;
    }
    setNicknameStatus("checking");
    setNicknameMessage("");

    showLoading();
    const param = { nickname };

    const res = await checkNicknameAPI(param);

    // 사용 가능한 닉네임
    if (res.code === 200) {
      setNicknameStatus("ok");
      setNicknameMessage(res.message);
    } else {
      // 이미 사용 중인 닉네임
      if (res.code === 409) {
        setNicknameStatus("error");
        setNicknameMessage(res.message);
      } else {
        setNicknameStatus("idle");
      }
    }
    hideLoading();
  };

  // 비밀번호 강도 체크
  const checkPasswordStrength = (pass: string) => {
    setPassword(pass);
    setPasswordError("");
    if (pass.length === 0) {
      setPasswordStrength(0);
    } else if (pass.length < 8) {
      setPasswordStrength(1); // 약함
    } else if (pass.length < 12 || !/\d/.test(pass) || !/[a-zA-Z]/.test(pass)) {
      setPasswordStrength(2); // 중
    } else {
      setPasswordStrength(3); // 강
    }
  };

  // 폼 제출(회원가입) 핸들러
  const handleSubmit = async () => {
    if (!email) {
      setEmailError("이메일을 입력해주세요.");
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

    const request: SignUpReqDto = {
      email: email,
      password: password,
      nickname: nickname,
    };

    const res = await signupAPI(request);
    if (res.code === 201) {
      // 회원가입 성공
      alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
      window.location.href = "/signin"; // 로그인 페이지로 리디렉션
    } else {
      setFormStatus("idle");
    }
  };

  // 비밀번호 강도에 따른 Tailwind CSS 클래스 반환
  const getPasswordStrengthClasses = () => {
    switch (passwordStrength) {
      case 1:
        return {
          bar: "w-1/4 bg-red-500 ",
          text: "비밀번호 강도: 약함",
          color: "text-red-500",
        };
      case 2:
        return {
          bar: "w-1/2 bg-yellow-500",
          text: "비밀번호 강도: 중간",
          color: "text-yellow-500",
        };
      case 3:
        return {
          bar: "w-full bg-green-500",
          text: "비밀번호 강도: 강함",
          color: "text-green-500",
        };
      default:
        return { bar: "", text: "", color: "" };
    }
  };
  const strength = getPasswordStrengthClasses();

  return (
    <div className="relative flex w-full h-full flex-col items-center justify-center py-5">
      <main className="relative z-10 flex w-full max-w-md flex-col items-center rounded-xl sm:p-10">
        <div className="mb-6 flex flex-col items-center gap-4 text-slate-800"></div>
        <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          회원가입
        </h1>
        <p className="mb-6 text-base text-slate-600">플랫폼에 오신 것을 환영합니다!</p>

        {/* 폼 영역 */}
        <div className="flex w-full flex-col gap-4">
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

          {/* 닉네임 입력 */}
          <div className="flex flex-col gap-2">
            <label className="flex flex-col flex-1">
              <p className="pb-2 text-sm font-medium text-slate-700">닉네임</p>
              <div className="flex w-full items-stretch">
                <input
                  className={`form-input h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg rounded-r-none border border-r-0 p-3 text-base font-normal placeholder:text-slate-400 focus:z-10 focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                    ${
                      nicknameStatus === "error"
                        ? "border-red-500 focus:ring-red-500/20" // 에러
                        : "border-slate-300 bg-white text-slate-900" // 기본
                    }`}
                  placeholder="사용하실 닉네임을 입력해주세요"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setNicknameStatus("idle");
                    setNicknameMessage("");
                  }}
                />
                <button
                  className={`flex h-12 flex-shrink-0 items-center justify-center
                  rounded-r-lg border border-l-0 
                  px-4 text-sm font-medium text-blue-500 
                  hover:bg-slate-100 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary/50
                  ${
                    nicknameStatus === "error"
                      ? "border-red-500" // 에러 시 빨간색 테두리 (상, 우, 하)
                      : "border-slate-300 bg-white" // 기본 상태
                  }`}
                  onClick={handleCheckNickname}
                  disabled={nicknameStatus === "checking"}
                >
                  {nicknameStatus === "checking" ? "확인 중..." : "중복 확인"}
                </button>
              </div>

              {/* 닉네임 상태 메시지 */}
              {nicknameMessage && (
                <p
                  className={`text-sm mt-1 ${
                    nicknameStatus === "ok" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {nicknameStatus === "ok" ? "✅" : "❌"} {nicknameMessage}
                </p>
              )}
            </label>
          </div>

          {/* 비밀번호 입력 */}
          <div className="flex flex-col gap-3">
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
            {/* 비밀번호 강도 알림 텍스트 */}
            {password.length > 0 && (
              <div className="flex flex-col gap-2 px-1">
                <div className="h-1.5 w-full rounded-full bg-slate-200">
                  <div className={`h-1.5 rounded-full transition-all ${strength.bar}`}></div>
                </div>
                <p className={`text-xs font-medium ${strength.color}`}>{strength.text}</p>
              </div>
            )}
          </div>

          {/* 비밀번호 확인 입력 */}
          <Input
            type={"password"}
            label="비밀번호 확인"
            placeholder="8자 이상 입력해 주세요"
            value={passwordConfirm}
            showPassword={showPasswordConfirm}
            errorMessage={passwordConfirmError}
            onChange={(e) => {
              setPasswordConfirm(e.target.value);
              setPasswordConfirmError("");
            }}
            togglePasswordVisibility={() => setShowPasswordConfirm(!showPasswordConfirm)}
          />

          {/* 이용약관 링크 */}
          <div className="flex flex-col gap-1 pt-2">
            <div className="flex items-center space-x-2">
              <input
                className="form-checkbox h-4 w-4 rounded border-slate-300 bg-slate-100 text-primary focus:ring-2 focus:ring-primary/50"
                id="terms"
                type="checkbox"
                checked={termsChecked}
                onChange={(e) => {
                  setTermsChecked(e.target.checked);
                  setTermsError("");
                }}
              />
              <label className="text-sm font-medium leading-none text-slate-600" htmlFor="terms">
                <Link
                  className="font-semibold text-[#5A9CFF] hover:text-blue-400 hover:underline"
                  href="/terms"
                >
                  이용약관
                </Link>{" "}
                및{" "}
                <Link
                  className="font-semibold text-[#5A9CFF] hover:text-blue-400 hover:underline"
                  href="/privacy"
                >
                  개인정보 처리방침
                </Link>
                에 동의합니다.
              </label>
            </div>
            {termsError && <p className="text-red-500 text-sm mt-1">❌ {termsError}</p>}
          </div>

          {/* 가입 버튼 및 SNS */}
          <div className="flex flex-col gap-4 pt-4">
            <LongButton
              title="가입"
              onClick={handleSubmit}
              disabled={formStatus === "submitting"}
            />

            {/* '또는' 구분선 */}
            <div className="relative my-2 w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white/80 px-2 text-slate-500 backdrop-blur-lg">또는</span>
              </div>
            </div>

            {/* SNS 버튼 */}
            <div className="w-full space-y-3">
              <SnsLoginBtn
                type="google"
                title="Google로 계속하기"
                onClick={() => alert("Google 로그인 API 연동 필요")}
              />
              <SnsLoginBtn
                type="apple"
                title="Apple로 계속하기"
                onClick={() => alert("Apple 로그인 API 연동 필요")}
              />
            </div>
          </div>
        </div>

        {/* 로그인 링크 */}
        <div className="mt-8 text-center text-sm text-slate-600">
          <span>이미 계정이 있으신가요?</span>
          <LinkText title="로그인" href="/signin" />
        </div>
      </main>
    </div>
  );
}
