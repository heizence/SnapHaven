"use client";
import { useState, useEffect } from "react";
import { Pencil, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { editProfileImageAPI, editProfileInfoAPI, getProfileInfoAPI } from "@/lib/APIs";
import { isValidPassword, isValidUsername, validateImageFile } from "@/lib/utils";
import { AWS_BASE_URL } from "@/constants";
import CustomLocalStorage from "@/lib/CustomLocalStorage";
import { useLoading } from "@/contexts/LoadingProvider";
import { EditProfileReq } from "@/types/api-dtos";

interface EditFormState {
  nickname: string;
  currentPassword: "";
  newPassword: "";
  confirmPassword: "";
}

export default function EditProfilePage() {
  const router = useRouter();

  const [form, setForm] = useState<EditFormState>({
    nickname: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // 비밀번호 입력창 표시 여부. SNS 계정이면 false
  const [authProvider, setAuthProvider] = useState<"EMAIL" | "GOOGLE" | "APPLE" | "">("");

  const [nicknameError, setNicknameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileImgPreview, setProfileImgPreview] = useState<string | undefined>("");
  const [isReady, setIsReady] = useState(false);

  const { showLoading, hideLoading } = useLoading();
  // 현재 프로필 데이터 불러오기
  const loadProfileData = async () => {
    showLoading();
    const res = await getProfileInfoAPI();
    if (res.code === 202) {
      const { nickname, profileImageKey } = res.data;
      const data = res.data;
      setForm({
        ...form,
        nickname,
      });
      setProfileImgPreview(profileImageKey ? AWS_BASE_URL + profileImageKey : undefined);
      setAuthProvider(data.authProvider);
    }

    setIsReady(true);
    hideLoading();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // 입력 시 에러 초기화
    if (name === "nickname") setNicknameError("");
    if (name.includes("Password")) setPasswordError("");
  };

  // 프로필 이미지 변경
  const handleProfileImgChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files;
    if (!selectedFile || selectedFile.length === 0) return;

    const fileCheck = validateImageFile(selectedFile[0]);
    if (!fileCheck.valid) {
      alert(fileCheck.reason);
      return;
    }

    const formData = new FormData();
    formData.append("files", selectedFile[0]);

    const res = await editProfileImageAPI(formData);
    if (res.code === 202) {
      setProfileImgPreview(AWS_BASE_URL + res.data);
      CustomLocalStorage.updateUserInfo({
        profileImageKey: res.data!,
      });
      alert(res.message);
      router.refresh();
    }
  };

  // 저장하기 버튼 클릭(닉네임 및 비밀번호 변경)
  const handleSave = async () => {
    // 에러 초기화
    setNicknameError("");
    setPasswordError("");

    // 닉네임 유효성 검사
    if (!form.nickname) {
      setNicknameError("이름을 입력해 주세요");
      return;
    } else if (!isValidUsername(form.nickname)) {
      setNicknameError(
        "사용자 이름은 1자 이상 20자 이하이어야 하고 특수문자를 포함할 수 없습니다."
      );
      return;
    }

    // 비밀번호 유효성 검사 (하나라도 입력된 경우)
    const passFields = [form.currentPassword, form.newPassword, form.confirmPassword];
    if (passFields.some((field) => field.trim() !== "")) {
      if (!isValidPassword(form.currentPassword)) {
        setPasswordError("비밀번호는 8자 이상이고 영문, 숫자, 특수기호가 포함되어야 합니다.");
        return;
      }
      if (!form.newPassword) {
        setPasswordError("새 비밀번호를 입력하세요.");
        return;
      }
      if (!isValidPassword(form.newPassword)) {
        setPasswordError("새 비밀번호는 8자 이상이고 영문, 숫자, 특수기호가 포함되어야 합니다.");
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        setPasswordError("새 비밀번호 확인이 일치하지 않습니다.");
        return;
      }
    }

    const request: EditProfileReq = {
      newNickname: form.nickname || undefined,
      currentPassword: form.currentPassword || undefined,
      newPassword: form.newPassword || undefined,
    };

    const res = await editProfileInfoAPI(request);
    if (res.code === 202) {
      alert(res.message);
      setForm({
        nickname: form.nickname,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  if (!isReady) return null;

  return (
    <main className="w-full min-h-[calc(100vh-56px)] bg-gray-100 px-5 py-8">
      <div className="container mx-auto py-10">
        <div className="flex w-full max-w-xl mx-auto flex-col overflow-hidden rounded-xl bg-white shadow-xl p-8 md:p-8 gap-5">
          <h1 className="text-3xl font-bold text-center text-gray-900">프로필 수정</h1>

          {/* 프로필 사진 변경 */}
          <div className="flex flex-col items-center gap-4">
            {profileImgPreview ? (
              <Image
                src={profileImgPreview}
                alt="preview"
                width={0} // width 및 height 속성은 필수값이라서 형식적으로 넣어둠
                height={0}
                priority={true}
                className="w-32 h-32 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <User size={70} className="text-gray-500" />
              </div>
            )}

            <input
              type="file"
              multiple={false}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              id="fileInput"
              onChange={handleProfileImgChange}
            />
            <label
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-lm font-semibold text-white transition-colors hover:bg-blue-700 cursor-pointer"
              htmlFor="fileInput"
            >
              <Pencil size={16} />
              <span>사진 변경</span>
            </label>
          </div>

          {/* 닉네임 변경 */}
          <div className="flex flex-col gap-2">
            <label className="text-lg font-semibold text-gray-800" htmlFor="nickname">
              닉네임 변경
            </label>
            <input
              id="nickname"
              name="nickname"
              value={form.nickname}
              onChange={handleChange}
              className="p-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {nicknameError && <p className="text-red-500 text-sm mt-1">❌ {nicknameError}</p>}
          </div>

          {/* 비밀번호 변경 */}
          {Boolean(authProvider === "EMAIL") && (
            <>
              <h2 className="text-lg font-semibold text-gray-800">비밀번호 변경</h2>
              <div className="flex flex-col gap-2">
                <label className="block mb-1 font-medium text-gray-700">현재 비밀번호</label>
                <input
                  name="currentPassword"
                  type="password"
                  value={form.currentPassword}
                  onChange={handleChange}
                  className="p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="block mb-1 font-medium text-gray-700">새 비밀번호</label>
                <input
                  name="newPassword"
                  type="password"
                  value={form.newPassword}
                  onChange={handleChange}
                  className="p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="block mb-1 font-medium text-gray-700">새 비밀번호 확인</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {passwordError && <p className="text-red-500 text-sm">❌ {passwordError}</p>}
            </>
          )}

          {/* 저장 버튼 및 계정 삭제 */}
          <div className="pt-6 flex flex-col items-center gap-4">
            <button
              type="submit"
              className="px-6 py-3 w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              onClick={handleSave}
            >
              저장하기
            </button>

            <button
              type="button"
              className="text-red-500 underline text-sm"
              onClick={() => {
                router.push(`/mypage/delete`);
              }}
            >
              계정 삭제
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
