"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation";
import { isValidEmail } from "@/lib/utils";
import { checkEmailAPI, signupAPI } from "@/lib/APIs";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">(
    "idle"
  );
  const [verifiedEmail, setVerifiedEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const onChangeEmail = useCallback(
    debounce((email: string) => {
      // 여기서 중복 확인 API 호출
      if (email !== verifiedEmail && emailStatus !== "idle") {
        setEmailStatus("idle");
        setEmailError("");
      }
      setEmail(email);
    }, 300),
    []
  );

  // 입력값 변경 시 debounce된 함수 호출
  const debouncedOnChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    onChangeEmail(e.target.value);
  };

  const checkEmailAvailability = async () => {
    if (!email) {
      setEmailError("이메일을 입력해 주세요");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError("유효한 이메일 주소를 입력하세요.");
      return;
    }

    setEmailError("");
    setEmailStatus("checking");
    try {
      const reqBody = {
        email: email,
      };

      const res = await checkEmailAPI(reqBody);

      console.log("res : ", res);

      if (res.success) {
        setEmailStatus("available");
        setVerifiedEmail(email);
      } else if (res.code === 401) {
        setEmailStatus("taken");
      }
    } catch (error) {
      console.error("Error checking email:", error);
      alert("에러가 발생했습니다.");
      setEmailStatus("idle");
    }
  };

  const signUp = async () => {
    if (!email) {
      setEmailError("이메일을 입력해 주세요");
      return;
    } else if (emailStatus !== "available") {
      alert("이메일 중복체크를 해주세요.");
      return;
    } else if (!password) {
      alert("비밀번호를 입력해 주세요");
      return;
    } else if (password !== confirmPw) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const reqBody = {
        email: email,
        password: password,
      };

      const res = await signupAPI(reqBody);
      console.log("res : ", res);

      if (res.success) {
        alert("회원가입이 완료되었습니다.");
        router.push("signin");
      }
    } catch (error) {
      console.error(error);
      alert("에러가 발생하였습니다.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-100px)] bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-center text-xl font-semibold mb-4">Sign up</h2>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
          <div className="flex">
            <input
              type="email"
              placeholder="name@email.com"
              className="w-full p-1 border border-gray-300 rounded-l-sm"
              value={email}
              //onChange={(e) => setEmail(e.target.value)}
              onChange={debouncedOnChangeEmail}
            />
            <Button
              className="ml-2 bg-blue-500 text-white px-3 rounded-r-sm"
              onClick={checkEmailAvailability}
              disabled={emailStatus === "checking"}
            >
              {emailStatus === "checking" ? "Checking..." : "Check"}
            </Button>
          </div>
          {emailError && <p className="text-red-500 text-sm mt-1">❌ {emailError}</p>}
          {emailStatus === "available" && (
            <p className="text-green-500 text-sm mt-1">✅ Email is available</p>
          )}
          {emailStatus === "taken" && (
            <p className="text-red-500 text-sm mt-1">❌ Email is already taken</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full p-1 pr-10 border border-1px border-solid rounded-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-1">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              className="w-full p-1 pr-10 border border-1px border-solid rounded-sm"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm mb-4">
          <a href="/signin" className="hover:underline">
            Already have an account?
          </a>
        </div>

        <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={signUp}>
          Sign Up
        </Button>
      </div>
    </div>
  );
}
