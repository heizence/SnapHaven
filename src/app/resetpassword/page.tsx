"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { isValidEmail } from "@/lib/utils";
import { resetPasswordAPI } from "@/lib/APIs";

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
      const res = await resetPasswordAPI({ email });
      console.log("res : ", res);
      if (res.code === 404) {
        alert("존재하지 않는 계정입니다.");
      } else if (res.code === 200) {
        alert("해당 이메일로 재설정 링크를 발송했습니다.");
      }
    } catch (error) {
      console.error("Error checking email:", error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-100px)] bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-center text-xl font-semibold mb-4">Reset Password</h2>
        <p className="text-sm text-gray-600 mb-4 text-center">
          {`Enter your email, and we'll send you a new password.`}
        </p>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            placeholder="name@email.com"
            className="w-full p-1 border border-1px border-solid rounded-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {emailError && <p className="text-red-500 text-sm mt-1">❌ {emailError}</p>}
          {emailStatus === "available" && (
            <p className="text-green-500 text-sm mt-1">✅ Email is available</p>
          )}
          {emailStatus === "taken" && (
            <p className="text-red-500 text-sm mt-1">❌ Email is already taken</p>
          )}
        </div>

        <div className="text-center text-gray-500 text-sm mb-4">
          <a href="/signin" className="hover:underline">
            Remember your password?
          </a>
        </div>

        <Button
          className="w-full bg-green-500 hover:bg-green-600 text-white"
          onClick={checkEmailAvailability}
        >
          Send new password
        </Button>
      </div>
    </div>
  );
}
