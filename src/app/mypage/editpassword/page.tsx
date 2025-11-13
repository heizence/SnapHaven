"use client";

import { editPasswordAPI } from "@/lib/APIs";
import { hashString } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePwVisibility = () => setShowPassword(!showPassword);
  const toggleNewPwVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmPwVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const editPassword = async () => {
    if (!password) {
      alert("현재 비밀번호를 입력해 주세요");
      return;
    } else if (!newPassword) {
      alert("새 비밀번호를 입력해 주세요");
    } else if (!confirmPassword) {
      alert("확인 비밀번호를 입력해 주세요");
    } else if (newPassword !== confirmPassword) {
      alert("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const hashedCurrentPw = await hashString(password);
      const hashedNewPw = await hashString(newPassword);

      const res = await editPasswordAPI({
        currentPassword: hashedCurrentPw,
        newPassword: hashedNewPw,
      });

      console.log("res : ", res);
      if (res.success) {
        alert("비밀번호가 변경되었습니다.");
        router.push("/mypage/edit");
      } else {
        alert(res.message);
      }
    } catch (error) {
      console.error(error);
      alert("에러가 발생하였습니다.");
    }
  };

  return (
    <div className="flex flex-col justify-center px-4 py-16 space-y-8">
      <h1 className="text-2xl font-semibold text-center">비밀번호 변경</h1>

      <div className="justify-center-safe space-y-4">
        <div className="w-full sm:w-3/4 md:w-1/2 mx-auto px-4">
          <label className="block mb-1 font-medium">현재 비밀번호</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="currentPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="현재 비밀번호"
              className="w-full px-3 py-2 pr-10 text-base border rounded block"
            />
            <button
              type="button"
              onClick={togglePwVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="w-full sm:w-3/4 md:w-1/2 mx-auto px-4">
          <label className="block mb-1 font-medium">새 비밀번호</label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호"
              className="w-full px-3 py-2 pr-10 text-base border rounded block"
            />
            <button
              type="button"
              onClick={toggleNewPwVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="w-full sm:w-3/4 md:w-1/2 mx-auto px-4">
          <label className="block mb-1 font-medium">새 비밀번호 확인</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호 확인"
              className="w-full px-3 py-2 pr-10 text-base border rounded block"
            />
            <button
              type="button"
              onClick={toggleConfirmPwVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-6 text-center">
        <button
          type="submit"
          className="bg-green-400 text-white px-6 py-3 text-base rounded"
          onClick={editPassword}
        >
          변경하기
        </button>
      </div>
    </div>
  );
}
