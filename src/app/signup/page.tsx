"use client";

import { useState } from "react";
// import { useRouter } from "next/navigation"; // Next.js 환경에서 주석 해제
import { Eye, EyeOff } from "lucide-react"; // 비밀번호 토글 아이콘 (lucide-react 필요)
import { AppleLogo, GoogleLogo } from "@/components/ui/SvgIcons";
import Link from "next/link";

// --- 임시 모의(Mock) API 함수 시작 ---
// (실제 프로젝트에서는 이 함수들 대신
// /api/signup, /api/check-nickname 엔드포인트로 fetch를 실행합니다)

// [기능 구현] /api/signup (Input 2)를 호출하는 모의 함수
const signupAPI = async (data: any): Promise<{ code: number; message: string }> => {
  console.warn("Using mock signupAPI. Please replace with actual fetch.");
  console.log("Mock signupAPI called with:", data);
  await new Promise((res) => setTimeout(res, 1000)); // 1초 딜레이

  // (Input 2의 이메일 중복 체크 로직 시뮬레이션)
  if (data.email.includes("used@email.com")) {
    return { code: 401, message: "The email has already been registered." };
  }
  return { code: 201, message: "User has been registered successfully" };
};

// [기능 구현] 닉네임 중복 확인 API 모의 함수
const checkNicknameAPI = async (nickname: string): Promise<{ code: number; message: string }> => {
  console.warn("Using mock checkNicknameAPI. Please replace with actual fetch.");
  await new Promise((res) => setTimeout(res, 500)); // 0.5초 딜레이

  if (nickname.toLowerCase() === "admin") {
    return { code: 409, message: "사용할 수 없는 닉네임입니다." };
  }
  return { code: 200, message: "사용 가능한 닉네임입니다." };
};
// --- 임시 모의(Mock) API 함수 끝 ---

export default function SignupPage() {
  // --- 1. State 정의 (기능 구현) ---
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
  // const router = useRouter(); // Next.js 환경에서 주석 해제

  // --- 2. 핸들러 함수 (기능 구현) ---

  // 닉네임 중복 확인 핸들러
  const handleCheckNickname = async () => {
    if (!nickname) {
      setNicknameStatus("error");
      setNicknameMessage("닉네임을 입력해주세요.");
      return;
    }
    setNicknameStatus("checking");
    setNicknameMessage("");

    const res = await checkNicknameAPI(nickname);
    if (res.code === 200) {
      setNicknameStatus("ok");
      setNicknameMessage(res.message); // "사용 가능한 닉네임입니다."
    } else {
      setNicknameStatus("error");
      setNicknameMessage(res.message); // "사용할 수 없는 닉네임입니다."
    }
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
    // Client-side 유효성 검사
    let isValid = true;
    if (!email) {
      setEmailError("이메일을 입력해주세요.");
      isValid = false;
    }
    if (nicknameStatus !== "ok") {
      setNicknameStatus("error");
      setNicknameMessage("닉네임 중복 확인을 완료해주세요.");
      isValid = false;
    }
    if (password.length < 8) {
      setPasswordError("비밀번호는 8자 이상이어야 합니다.");
      isValid = false;
    }
    if (password !== passwordConfirm) {
      setPasswordConfirmError("비밀번호가 일치하지 않습니다.");
      isValid = false;
    }
    if (!termsChecked) {
      setTermsError("약관에 동의해주세요.");
      isValid = false;
    }

    if (!isValid) return;

    setFormStatus("submitting");

    try {
      // [기능 구현] Input 2의 API 로직 호출
      // (보안: 실제로는 plain-text 비밀번호를 보내고,
      // API 라우트(Input 2)에서 hashString을 실행해야 합니다)
      const res = await signupAPI({
        email: email,
        password: password, // Input 2가 해싱하므로 plain-text 전송
        username: nickname,
      });

      if (res.code === 201) {
        // 회원가입 성공
        alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
        window.location.href = "/login"; // 로그인 페이지로 리디렉션
        // router.push("/login"); // Next.js 환경
      } else {
        // (Input 2의 이메일 중복 에러 등)
        setEmailError(res.message);
        setFormStatus("idle");
      }
    } catch (error) {
      console.error(error);
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
    <div className="relative flex h-[calc(100vh-56px)] w-full flex-col items-center justify-center bg-gray-100">
      <main className="relative z-10 flex w-full max-w-md flex-col items-center rounded-xl bg-white p-8 shadow-2xl sm:p-10">
        {/* 2. [수정] 로고 및 헤더 (로그인 페이지 스타일 적용) */}
        <div className="mb-6 flex flex-col items-center gap-4 text-slate-800"></div>
        <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          회원가입
        </h1>
        <p className="mb-6 text-base text-slate-600">플랫폼에 오신 것을 환영합니다!</p>

        {/* 3. 폼 (내부 스타일 수정) */}
        <div className="flex w-full flex-col gap-4">
          {/* 이메일 */}
          <label className="flex flex-col flex-1">
            <p className="pb-2 text-sm font-medium text-slate-700 ">이메일 주소</p>
            <input
              // [수정] 로그인 페이지 인풋 스타일 적용
              className={`form-input h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border p-3 text-base font-normal placeholder:text-slate-400 focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                ${
                  emailError
                    ? "border-red-500 focus:ring-red-500/20" // 에러
                    : "border-slate-300 bg-white text-slate-900" // 기본
                }`}
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
            />
            {emailError && <p className="text-red-500 text-sm mt-1">❌ {emailError}</p>}
          </label>

          {/* 닉네임 */}
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
                  className="flex h-12 flex-shrink-0 items-center justify-center rounded-r-lg border border-slate-300 bg-white px-4 text-sm font-medium text-blue-500 hover:bg-slate-100 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  onClick={handleCheckNickname}
                  disabled={nicknameStatus === "checking"}
                >
                  {nicknameStatus === "checking" ? "확인 중..." : "중복 확인"}
                </button>
              </div>
            </label>
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
          </div>

          {/* 비밀번호 */}
          <div className="flex flex-col gap-3">
            <label className="flex flex-col flex-1">
              <p className="pb-2 text-sm font-medium text-slate-700">비밀번호</p>
              <div className="relative flex w-full flex-1 items-stretch">
                <input
                  // [수정] 로그인 페이지 인풋 스타일 적용 (h-12, rounded-r-none)
                  className={`form-input h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg rounded-r-none border border-r-0 p-3 pr-2 text-base font-normal placeholder:text-slate-400 focus:z-10 focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                    ${
                      passwordError
                        ? "border-red-500 focus:ring-red-500/20" // 에러
                        : "border-slate-300 bg-white text-slate-900" // 기본
                    }`}
                  placeholder="8자 이상 입력해 주세요"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => checkPasswordStrength(e.target.value)}
                />
                <button
                  // [수정] 버튼 스타일 (h-12, slate 색상)
                  className="flex h-12 items-center justify-center rounded-r-lg border border-l-0 border-slate-300 bg-white px-3 text-slate-500 hover:bg-slate-100"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {/* [수정] lucide-react 아이콘 사용 */}
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </label>
            {/* 비밀번호 강도 (스타일 일관성 수정) */}
            {password.length > 0 && (
              <div className="flex flex-col gap-2 px-1">
                <div className="h-1.5 w-full rounded-full bg-slate-200">
                  <div className={`h-1.5 rounded-full transition-all ${strength.bar}`}></div>
                </div>
                <p className={`text-xs font-medium ${strength.color}`}>{strength.text}</p>
              </div>
            )}
            {passwordError && <p className="text-red-500 text-sm mt-1">❌ {passwordError}</p>}
          </div>

          {/* 비밀번호 확인 */}
          <label className="flex flex-col flex-1">
            <p className="pb-2 text-sm font-medium text-slate-700">비밀번호 확인</p>
            <div className="relative flex w-full flex-1 items-stretch">
              <input
                className={`form-input h-12 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg rounded-r-none border border-r-0 p-3 pr-2 text-base font-normal placeholder:text-slate-400 focus:z-10 focus:border-primary focus:outline-0 focus:ring-2 focus:ring-primary/20
                  ${
                    passwordConfirmError
                      ? "border-red-500 focus:ring-red-500/20" // 에러
                      : "border-slate-300 bg-white text-slate-900" // 기본
                  }`}
                placeholder="비밀번호를 다시 입력해 주세요"
                type={showPasswordConfirm ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  setPasswordConfirmError("");
                }}
              />
              <button
                className="flex h-12 items-center justify-center rounded-r-lg border border-l-0 border-slate-300 bg-white px-3 text-slate-500 hover:bg-slate-100"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              >
                {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordConfirmError && (
              <p className="text-red-500 text-sm mt-1">❌ {passwordConfirmError}</p>
            )}
          </label>

          {/* 이용약관 (스타일 일관성 수정) */}
          <div className="flex flex-col gap-1 pt-2">
            <div className="flex items-center space-x-2">
              <input
                // [수정] slate 색상 적용
                className="form-checkbox h-4 w-4 rounded border-slate-300 bg-slate-100 text-primary focus:ring-2 focus:ring-primary/50"
                id="terms"
                type="checkbox"
                checked={termsChecked}
                onChange={(e) => {
                  setTermsChecked(e.target.checked);
                  setTermsError("");
                }}
              />
              <label
                // [수정] slate 색상 적용
                className="text-sm font-medium leading-none text-slate-600"
                htmlFor="terms"
              >
                {/* [수정] 링크 색상 적용 (text-primary -> text-[#5A9CFF]) */}
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
            <button
              // [수정] 로그인 페이지 Primary 버튼 스타일 적용 (검은색)
              className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={formStatus === "submitting"}
            >
              가입
            </button>

            {/* '또는' 구분선 (로그인 페이지 스타일 적용) */}
            <div className="relative my-2 w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white/80 px-2 text-slate-500 backdrop-blur-lg">또는</span>
              </div>
            </div>

            {/* SNS 버튼 (로그인 페이지 스타일 적용) */}
            <div className="w-full space-y-3">
              <button
                className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2"
                onClick={() => alert("Google 가입 API 연동 필요")}
              >
                <GoogleLogo /> {/* [수정] SVG 컴포넌트 사용 */}
                <span>Google로 계속하기</span>
              </button>
              <button
                className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:ring-offset-2"
                onClick={() => alert("Apple 가입 API 연동 필요")}
              >
                <AppleLogo /> {/* [수정] SVG 컴포넌트 사용 */}
                <span>Apple로 계속하기</span>
              </button>
            </div>
          </div>
        </div>

        {/* 로그인 링크 (로그인 페이지 스타일 적용) */}
        <div className="mt-8 text-center text-sm text-slate-600">
          <span>이미 계정이 있으신가요?</span>
          {/* [수정] <a> -> <Link>, 링크 색상 변경 */}
          <Link
            className="ml-1 font-semibold text-[#5A9CFF] hover:text-blue-400 hover:underline"
            href="/signin"
          >
            로그인
          </Link>
        </div>
      </main>
    </div>
  );
}
