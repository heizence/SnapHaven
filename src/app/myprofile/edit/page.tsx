"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { editProfileAPI, getProfileInfoAPI } from "@/lib/APIs";
import { isValidEmail, isValidUsername } from "@/lib/utils";

export default function EditProfilePage() {
  const router = useRouter();
  const inputClassName = "input w-full px-3 py-2 text-base border rounded";

  const [form, setForm] = useState({
    username: "",
    email: "",
    profileImg: "",
  });

  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(form);

    if (!form.username) {
      setUsernameError("이름을 입력해 주세요");
      return;
    } else if (!isValidUsername(form.username)) {
      setUsernameError(
        "사용자 이름은 1자 이상 20자 이하이어야 하고 특수문자를 포함할 수 없습니다."
      );
      return;
    } else if (!form.email) {
      setEmailError("이메일을 입력해 주세요");
      return;
    } else if (!isValidEmail(form.email)) {
      setEmailError("유효한 이메일 주소를 입력하세요.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("username", form.username);
      formData.append("email", form.email);
      formData.append("profileImg", form.profileImg);

      const res = await editProfileAPI(formData);
      console.log("res : ", res);
      if (res.success) {
        alert("프로필 정보가 변경되었습니다.");
      } else {
        alert("에러가 발생하였습니다.");
      }
    } catch (error) {
      console.log(error);
      alert("에러가 발생하였습니다.");
    }
  };

  const getProfileInfo = async () => {
    try {
      const res = await getProfileInfoAPI();
      if (res.success) {
        setForm((prev) => ({
          ...prev,
          username: res.data.username,
          email: res.data.email,
        }));
        //setProfileInfo(res.data);
      } else {
        alert("에러가 발생하였습니다.");
      }
    } catch (error) {
      console.log(error);
      alert("에러가 발생하였습니다.");
    }
  };

  useEffect(() => {
    getProfileInfo();
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl mx-auto px-4 py-10 space-y-10 text-sm text-gray-800"
    >
      <h1 className="text-2xl font-semibold text-center">프로필 수정</h1>

      {/* Profile photo */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-rose-400 flex items-center justify-center text-white text-2xl font-bold">
          D
        </div>
        <button type="button" className="bg-green-400 px-4 py-1.5 rounded text-white">
          이미지 변경
        </button>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">이름 *</label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            className={inputClassName}
          />
          {usernameError && <p className="text-red-500 text-sm mt-1">❌ {usernameError}</p>}
        </div>

        <div>
          <label className="block mb-1 font-medium">이메일 *</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className={inputClassName}
          />
          {emailError && <p className="text-red-500 text-sm mt-1">❌ {emailError}</p>}
        </div>
      </div>

      {/* Extra settings */}
      <div className="pt-6">
        <h2 className="text-lg font-semibold mb-2">추가 설정</h2>
        <button
          type="button"
          className="text-gray-500 underline text-sm block mb-2"
          onClick={() => {
            router.push("/myprofile/editpassword");
          }}
        >
          비밀번호 변경
        </button>
        <button
          type="button"
          className="text-red-500 underline text-sm block"
          onClick={() => {
            router.push("/myprofile/delete");
          }}
        >
          계정 삭제
        </button>
      </div>

      <div className="pt-6 text-center">
        <button type="submit" className="bg-green-400 text-white px-6 py-2 rounded">
          프로필 저장
        </button>
      </div>
    </form>
  );
}
