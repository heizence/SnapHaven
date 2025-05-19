"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { isValidEmail, isValidUsername } from "@/lib/utils";
import { checkEmailAPI, checkUsernameAPI, signupAPI } from "@/lib/APIs";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">(
    "idle"
  );

  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">(
    "idle"
  );

  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

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
      } else if (res.code === 401) {
        setEmailStatus("taken");
      }
    } catch (error) {
      console.error("Error checking email:", error);
      alert("에러가 발생했습니다.");
      setEmailStatus("idle");
    }
  };

  const checkUsernameAvailability = async () => {
    if (!username) {
      setUsernameError("이름을 입력해 주세요");
      return;
    }
    if (!isValidUsername(username)) {
      setUsernameError(
        "사용자 이름은 1자 이상 20자 이하이어야 하고 특수문자를 포함할 수 없습니다."
      );
      return;
    }

    setUsernameError("");
    setUsernameStatus("checking");
    try {
      const reqBody = {
        username: username,
      };

      const res = await checkUsernameAPI(reqBody);

      console.log("res : ", res);

      if (res.success) {
        setUsernameStatus("available");
      } else if (res.code === 401) {
        setUsernameStatus("taken");
      }
    } catch (error) {
      console.error("Error checking username:", error);
      alert("에러가 발생하였습니다.");
      setUsernameStatus("idle");
    }
  };

  const signUp = async () => {
    if (!email) {
      setEmailError("이메일을 입력해 주세요.");
      return;
    } else if (emailStatus !== "available") {
      alert("이메일 중복체크를 해주세요.");
      return;
    } else if (!username) {
      alert("사용자 이름을 입력해 주세요.");
      return;
    } else if (usernameStatus !== "available") {
      alert("사용자 이름 중복체크를 해주세요.");
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
        email,
        password,
        username,
      };

      const res = await signupAPI(reqBody);
      console.log("res : ", res);

      if (res.success) {
        alert("회원가입이 완료되었습니다.");
        router.push("signin");
      } else {
        alert("에러가 발생하였습니다.");
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

        {/* Email  */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
          <div className="flex">
            <input
              type="email"
              placeholder="name@email.com"
              className="w-full p-1 border border-gray-300 rounded-l-sm"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailStatus("idle");
              }}
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

        {/* Username  */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-1">Username</label>
          <div className="flex">
            <input
              placeholder="Username"
              className="w-full p-1 border border-gray-300 rounded-l-sm"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameStatus("idle");
              }}
            />
            <Button
              className="ml-2 bg-blue-500 text-white px-3 rounded-r-sm"
              onClick={checkUsernameAvailability}
              disabled={usernameStatus === "checking"}
            >
              {usernameStatus === "checking" ? "Checking..." : "Check"}
            </Button>
          </div>
          {usernameError && <p className="text-red-500 text-sm mt-1">❌ {usernameError}</p>}
          {usernameStatus === "available" && (
            <p className="text-green-500 text-sm mt-1">✅ Username is available</p>
          )}
          {usernameStatus === "taken" && (
            <p className="text-red-500 text-sm mt-1">❌ Username is already taken</p>
          )}
        </div>

        {/* Password */}
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

        {/* Confirm password */}
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
