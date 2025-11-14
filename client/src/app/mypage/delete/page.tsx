"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hashString } from "@/lib/utils";
import { deleteAccountAPI } from "@/lib/APIs";

export default function DeleteAccount() {
  const router = useRouter();

  const [password, setPassword] = useState("");

  const deleteAccount = async () => {
    if (!password) {
      alert("현재 비밀번호를 입력해 주세요");
      return;
    }
    try {
      const hashedCurrentPw = await hashString(password);

      const res = await deleteAccountAPI({
        currentPassword: hashedCurrentPw,
      });

      console.log("res : ", res);
      if (res.success) {
        alert("계정이 삭제되었습니다.");
        router.push("/");
        router.refresh();
      } else {
        alert(res.message);
      }
    } catch (error) {
      console.error(error);
      alert("에러가 발생하였습니다.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-8 text-base text-gray-800">
      <h1 className="text-2xl font-semibold text-center">계정 삭제</h1>

      <p className="text-center text-gray-600">
        계정을 삭제하면 모든 데이터가 영구적으로 제거되며 복구할 수 없습니다. 계정을 삭제하려면 현재
        비밀번호를 입력하세요.
      </p>

      <div>
        <label className="block mb-2 font-medium">현재 비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 입력"
          className="w-full px-4 py-3 text-base border rounded"
        />
      </div>

      <div className="pt-6 text-center">
        <button
          type="submit"
          className="bg-red-500 text-white px-6 py-3 text-base rounded hover:bg-red-600"
          onClick={deleteAccount}
        >
          계정 삭제하기
        </button>
      </div>
    </div>
  );
}
