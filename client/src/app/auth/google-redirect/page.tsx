"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLoading } from "@/contexts/LoadingProvider";
import { googleAuthAPI } from "@/lib/APIs";
import CustomLocalStorage from "@/lib/CustomLocalStorage";
import { GoogleAuthReqDto } from "@/types/api-dtos";

export default function GoogleRedirectPage() {
  const router = useRouter();

  const { showLoading, hideLoading } = useLoading();
  const [hasProcessed, setHasProcessed] = useState(false); // 중복 요청 방지를 위한 상태
  const [processingStatus, setProcessingStatus] = useState("");

  useEffect(() => {
    if (hasProcessed || !window.location.hash) return;

    // accessToken 추출
    const parsedHash = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = parsedHash.get("access_token");
    const error = parsedHash.get("error");

    // [필수 보안 조치] URL Hash 를 지운다.
    window.history.replaceState(null, "", window.location.pathname);

    if (error) {
      console.log(error);
      setProcessingStatus(`Google 인증 실패: ${error}`);
      setTimeout(() => router.push("/signin"), 3000);
      return;
    }

    if (accessToken) {
      setHasProcessed(true);
      handleGoogleSignIn(accessToken);
    } else {
      setProcessingStatus("오류: Google access 토큰을 찾지 못했습니다.");
      setTimeout(() => router.push("/signin"), 3000);
    }
  }, [router, hasProcessed]);

  // BFF API 호출 및 최종 리디렉션
  const handleGoogleSignIn = async (accessToken: string) => {
    showLoading();

    try {
      // ID Token을 Next.js BFF 프록시로 전송
      const request: GoogleAuthReqDto = { accessToken };
      const res = await googleAuthAPI(request);
      const { id, nickname, profileImageKey } = res.data;

      CustomLocalStorage.saveUserInfo({ id, nickname, profileImageKey });

      router.push("/");
      router.refresh();
      hideLoading();
    } catch (error) {
      console.error("Final Login Failed:", error.message);
      setProcessingStatus(error.message || "로그인 처리 중 알 수 없는 오류가 발생했습니다.");
      hideLoading();
      setTimeout(() => router.push("/signin"), 3000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl">
        <h1 className="text-xl font-semibold text-blue-600 mb-4">인증 처리 중...</h1>
        <p className="text-gray-600">{processingStatus}</p>
      </div>
    </div>
  );
}
