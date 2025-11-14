"use client";
import { useState, useEffect } from "react";
import { CircleUserRound, Pencil, User } from "lucide-react"; // [수정] Pencil 임포트
import { useRouter } from "next/navigation";
import Image from "next/image";
import { editProfileAPI, getProfileInfoAPI } from "@/lib/APIs";
import { isValidEmail, isValidUsername } from "@/lib/utils";

// [신규] 폼 상태 인터페이스
interface EditFormState {
  username: string;
  bio: string; // [신규] bio 필드
  profileImg: File | null;
  currentPassword: "";
  newPassword: "";
  confirmPassword: "";
}

export default function EditProfilePage() {
  const router = useRouter();

  // [수정] 1. 폼 상태 재구성
  const [form, setForm] = useState<EditFormState>({
    username: "",
    bio: "",
    profileImg: null,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState(""); // [수정] emailError -> passwordError
  const [profileImgPreview, setProfileImgPreview] = useState<string>("");
  const [isReady, setIsReady] = useState(false);

  // [수정] 2. 범용 핸들러 (모든 input/textarea)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // 입력 시 에러 초기화
    if (name === "username") setUsernameError("");
    if (name.includes("Password")) setPasswordError("");
  };

  // 파일 핸들러 (기존과 동일)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files;
    if (!selectedFile || selectedFile.length === 0) return;

    const fileURL = URL.createObjectURL(selectedFile[0]);
    setForm((prev) => ({ ...prev, profileImg: selectedFile[0] }));
    setProfileImgPreview(fileURL);
  };

  // [수정] 3. 제출 핸들러 (비밀번호 로직 포함)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 에러 초기화
    setUsernameError("");
    setPasswordError("");

    // 닉네임 유효성 검사
    if (!form.username) {
      setUsernameError("이름을 입력해 주세요");
      return;
    } else if (!isValidUsername(form.username)) {
      setUsernameError(
        "사용자 이름은 1자 이상 20자 이하이어야 하고 특수문자를 포함할 수 없습니다."
      );
      return;
    }

    // 비밀번호 유효성 검사 (하나라도 입력된 경우)
    const passFields = [form.currentPassword, form.newPassword, form.confirmPassword];
    if (passFields.some((field) => field.trim() !== "")) {
      if (!form.currentPassword) {
        setPasswordError("현재 비밀번호를 입력하세요.");
        return;
      }
      if (!form.newPassword) {
        setPasswordError("새 비밀번호를 입력하세요.");
        return;
      }
      if (form.newPassword.length < 8) {
        // (예시: 8자 이상)
        setPasswordError("새 비밀번호는 8자 이상이어야 합니다.");
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        setPasswordError("새 비밀번호가 일치하지 않습니다.");
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append("username", form.username);
      formData.append("bio", form.bio);

      if (form.profileImg) {
        formData.append("profileImg", form.profileImg);
      }

      // 새 비밀번호가 입력된 경우에만 전송
      if (form.newPassword) {
        formData.append("currentPassword", form.currentPassword);
        formData.append("newPassword", form.newPassword);
      }

      console.log("Submitting FormData...", formData);

      const res = await editProfileAPI(formData);

      if (res.success) {
        alert("프로필 정보가 변경되었습니다.");
        router.push("/mypage"); // 마이페이지로 복귀
      } else {
        alert("에러가 발생하였습니다.");
      }
    } catch (error) {
      console.log(error);
      alert("에러가 발생하였습니다.");
    }
  };

  // [수정] 4. 프로필 정보 로드 (bio 추가, email 제거)
  const getProfileInfo = async () => {
    try {
      const res = {}; //await getProfileInfoAPI();
      if (res.success) {
        setForm((prev) => ({
          ...prev,
          username: res.data.username,
          bio: (res.data as any).bio || "", // bio 필드 추가
        }));
        setProfileImgPreview(res.data.profileImgUrl);
      } else {
        //alert("에러가 발생하였습니다.");
      }
      setIsReady(true);
    } catch (error) {
      console.log(error);
      //alert("에러가 발생하였습니다.");
    }
  };

  useEffect(() => {
    getProfileInfo();
  }, []);

  if (!isReady) return null; // 로딩 스피너 (추후 개선 가능)

  // [수정] 5. JSX 레이아웃 (밝은 테마 카드)
  return (
    <main className="w-full min-h-[calc(100vh-56px)] bg-gray-100 px-5 py-8">
      <div className="container mx-auto py-10">
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-xl mx-auto flex-col overflow-hidden rounded-xl bg-white shadow-xl p-8 md:p-8 gap-5"
        >
          <h1 className="text-3xl font-bold text-center text-gray-900">프로필 수정</h1>

          {/* 프로필 사진 변경 */}
          <div className="flex flex-col items-center gap-4">
            {profileImgPreview ? (
              <Image
                src={profileImgPreview}
                alt="preview"
                width={128}
                height={128}
                priority={true}
                className="w-32 h-32 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-[140] h-[140] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                <User size={80} className="text-gray-500" />
              </div>
            )}

            <input
              type="file"
              multiple={false}
              accept="image/*"
              className="hidden"
              id="fileInput"
              onChange={handleFileChange}
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
            <label className="text-lg font-semibold text-gray-800" htmlFor="username">
              닉네임 변경
            </label>
            <input
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="p-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {usernameError && <p className="text-red-500 text-sm mt-1">❌ {usernameError}</p>}
          </div>

          {/* 비밀번호 변경 */}

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

          {/* 저장 버튼 및 계정 삭제 */}
          <div className="pt-6 flex flex-col items-center gap-4">
            <button
              type="submit"
              className="px-6 py-3 w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              저장하기
            </button>

            <button
              type="button"
              className="text-red-500 underline text-sm"
              onClick={() => {
                router.push("/mypage/delete");
              }}
            >
              계정 삭제
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
