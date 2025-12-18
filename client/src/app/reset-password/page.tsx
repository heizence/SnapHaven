"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPasswordAPI } from "@/lib/APIs";
import { ResetPasswordReqDto } from "@/types/api-dtos";

type ResetPasswordForm = Omit<ResetPasswordReqDto, "token">;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const token = searchParams?.get("token");
  const password = watch("newPassword");

  const onSubmit = async (data: ResetPasswordForm) => {
    setError(null);

    if (!token) {
      setError("유효하지 않은 접근입니다. 이메일을 통해 다시 시도해 주세요.");
      return;
    }

    setIsLoading(true);

    const request: ResetPasswordReqDto = {
      token: token,
      newPassword: data.newPassword,
    };
    const res = await resetPasswordAPI(request);

    if (res.code === 200) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/signin");
      }, 3000);
    } else {
      if (res && res.message) {
        setError(res.message);
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
      setIsLoading(false);
    }
  };

  // 성공 시 메시지
  if (success) {
    return (
      <div className="container mx-auto max-w-md p-4">
        <h1 className="text-2xl font-bold text-green-600">성공</h1>
        <p>비밀번호가 성공적으로 변경되었습니다.</p>
        <p>3초 후 로그인 페이지로 이동합니다...</p>
      </div>
    );
  }

  // 토큰이 없는 경우
  if (!token) {
    return (
      <div className="container mx-auto max-w-md p-4">
        <h1 className="text-2xl font-bold text-red-600">오류</h1>
        <p>유효하지 않은 재설정 링크입니다. 이메일을 통해 받은 링크가 맞는지 확인해 주세요.</p>
      </div>
    );
  }

  // 폼 렌더링
  return (
    <div className="container mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold mb-4">새 비밀번호 설정</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="newPassword">새 비밀번호</label>
          <input
            id="newPassword"
            type="password"
            {...register("newPassword", {
              required: "새 비밀번호를 입력해주세요.",
              minLength: { value: 8, message: "8자 이상 입력해주세요." },
              pattern: {
                value: /^(?=.*[a-zA-Z])(?=.*\d).*$/,
                message: "영문자와 숫자를 최소 1개씩 포함해야 합니다.",
              },
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.newPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword">새 비밀번호 확인</label>
          <input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword", {
              required: "비밀번호를 다시 입력해주세요.",
              validate: (value) => value === password || "비밀번호가 일치하지 않습니다.",
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-400"
        >
          {isLoading ? "변경 중..." : "비밀번호 변경하기"}
        </button>
      </form>
    </div>
  );
}
