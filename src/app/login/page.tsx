"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { isValidEmail } from "@/lib/utils";

export default function Page() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">(
    "idle"
  );

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const login = async () => {
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
      // const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`);
      // const data = await response.json();
      // setEmailStatus(data.available ? "available" : "taken");
    } catch (error) {
      console.error("Error checking email:", error);
      //setEmailStatus("idle");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-100px)] bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-center text-xl font-semibold mb-4">Log in with your email</h2>

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

        <div className="text-center text-gray-500 text-sm mb-2">
          <a href="/resetpassword" className="hover:underline">
            Forgot your password?
          </a>
        </div>
        <div className="text-center text-gray-500 text-sm mb-4">
          <a href="/signup" className="hover:underline">
            {`Don't have an account?`}
          </a>
        </div>

        <Button
          className="w-full bg-green-500 hover:bg-green-600 text-white"
          onClick={login}
          disabled={emailStatus === "checking"}
        >
          Log in
        </Button>
      </div>
    </div>
  );
}
