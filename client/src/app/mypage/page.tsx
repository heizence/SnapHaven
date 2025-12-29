"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getProfileInfoAPI } from "@/lib/APIs";
import { LayoutGrid, Pencil, User } from "lucide-react";
import { AWS_BASE_URL } from "@/constants";

type ContentLabel = "내 업로드" | "내 좋아요" | "내 컬렉션";

interface ProfileInfo {
  nickname: string;
  profileImageUrl?: string;
}
interface EachUserContent {
  label: ContentLabel;
  count: number;
  thumbnail: string | null;
}

export default function MyProfilePage() {
  const router = useRouter();

  const [profileInfo, setProfileInfo] = useState<ProfileInfo>({
    nickname: "",
    profileImageUrl: "",
  });
  const [contents, setContents] = useState<EachUserContent[]>([]);
  const [isReady, setIsReady] = useState(false);

  const getProfileData = async () => {
    const res = await getProfileInfoAPI();

    if (res.code === 202) {
      const { nickname, profileImageKey, uploads, likes, collections } = res.data;
      setProfileInfo({
        nickname,
        profileImageUrl: profileImageKey ? AWS_BASE_URL + res.data.profileImageKey : undefined,
      });

      const contents = [
        { ...uploads, label: "내 업로드" },
        { ...likes, label: "내 좋아요" },
        { ...collections, label: "내 컬렉션" },
      ];

      setContents(contents);
    }
    setIsReady(true);
  };

  const handleContentOnclick = (label: ContentLabel) => {
    switch (label) {
      case "내 업로드":
        router.push("/mypage/uploads");
        break;
      case "내 좋아요":
        router.push("/mypage/likes");
        break;
      case "내 컬렉션":
        router.push("/mypage/collections");
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    getProfileData();
  }, []);

  if (!isReady) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-56px)] px-4 py-8">
      {/* Profile */}
      <div className="flex flex-col items-center text-center">
        {profileInfo.profileImageUrl ? (
          <Image
            src={profileInfo.profileImageUrl}
            alt="preview"
            width={128}
            height={128}
            priority
            className="w-32 h-32 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            <User size={70} className="text-gray-500" />
          </div>
        )}
        <h1 className="text-2xl font-semibold mt-4">{profileInfo.nickname}</h1>

        <button
          className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-lm font-semibold text-white transition-colors hover:bg-blue-700"
          onClick={() => {
            router.push("/mypage/edit");
          }}
        >
          <Pencil size={16} />
          <span>내 정보 수정</span>
        </button>
      </div>

      <div className="mt-12 border-t pt-8 w-full">
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          {contents.map((each, index) => (
            <div
              key={index}
              className="w-full sm:w-60 md:w-72 cursor-pointer"
              onClick={() => handleContentOnclick(each.label)}
            >
              <div className="relative aspect-square rounded-lg overflow-hidden border shadow-sm transition-all hover:shadow-md">
                {each.count === 0 || !each.thumbnail ? (
                  // 콘텐츠 없음 상태
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center p-4"></div>
                ) : (
                  // 썸네일 이미지
                  <Image
                    src={AWS_BASE_URL + each.thumbnail}
                    alt={""}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 33vw, 25vw"
                  />
                )}
              </div>
              {/* 카드 하단 정보 */}
              <div className="flex justify-between items-center text-base mt-2 px-1">
                <span className="font-semibold text-gray-800">{each.label}</span>
                <div className="flex items-center gap-1 text-gray-600">
                  <LayoutGrid size={16} />
                  <span className="font-medium">{each.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
