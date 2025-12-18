"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteUserAPI, getProfileInfoAPI } from "@/lib/APIs";
import { useLoading } from "@/contexts/LoadingProvider";
import { DeleteUserReqDto } from "@/types/api-dtos";
import CustomLocalStorage from "@/lib/CustomLocalStorage";

export default function Page() {
  const router = useRouter();

  const [authProvider, setAuthProvider] = useState<"EMAIL" | "GOOGLE" | "APPLE" | "">("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const { showLoading, hideLoading } = useLoading();
  // 현재 프로필 데이터 불러오기
  const loadProfileData = async () => {
    showLoading();
    const res = await getProfileInfoAPI();
    if (res.code === 202) {
      const data = res.data;
      setAuthProvider(data.authProvider);
    }
    hideLoading();
  };

  const deleteUser = async () => {
    if (!password && authProvider === "EMAIL") {
      alert("현재 비밀번호를 입력해 주세요");
      return;
    }
    showLoading();
    const request: DeleteUserReqDto = {
      currentPassword: password,
    };

    const res = await deleteUserAPI(request);

    if (res.code === 200) {
      alert(res.message);
      CustomLocalStorage.clearUserInfo();
      router.push("/");
      router.refresh();
    }
    hideLoading();
  };

  const handleInputChange = (e) => {
    if (authProvider === "EMAIL") {
      setPassword(e.target.value);
    } else {
      setConfirmation(e.target.value);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const isSNS = authProvider !== "EMAIL";
  const isInputValid = isSNS ? confirmation === "계정을 삭제합니다" : password.length >= 8;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-8 text-base text-gray-800">
      <h1 className="text-2xl font-semibold text-center">계정 삭제</h1>

      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded leading-relaxed">
        <p>계정을 삭제하면 모든 데이터가 즉시 삭제되며 복구할 수 없습니다.</p>
        {isSNS ? (
          <p className="mt-2">
            계속하려면 아래 입력창에
            <strong> “계정을 삭제합니다” </strong>라고 입력하세요.
          </p>
        ) : (
          <p className="mt-2">
            계속하려면 아래 입력창에
            <strong> 현재 비밀번호를 </strong>입력하세요.
          </p>
        )}
      </div>

      <div>
        <label className="block mb-2 font-medium">{isSNS ? "확인 문구" : "현재 비밀번호"}</label>
        <input
          type={isSNS ? "text" : "password"}
          value={isSNS ? confirmation : password}
          onChange={handleInputChange}
          placeholder={isSNS ? "계정을 삭제합니다" : "비밀번호 입력"}
          className="w-full px-4 py-3 text-base border rounded"
        />
      </div>

      <div className="pt-6 text-center">
        <button
          type="submit"
          disabled={!isInputValid}
          onClick={deleteUser}
          className={`px-6 py-3 text-base rounded text-white
          ${isInputValid ? "bg-red-500 hover:bg-red-600" : "bg-red-300 cursor-not-allowed"}`}
        >
          계정 삭제하기
        </button>
      </div>
    </div>
  );
}
