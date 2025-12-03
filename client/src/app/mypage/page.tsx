"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProfileInfoAPI } from "@/lib/APIs";
import { ProfileInfo } from "@/lib/interfaces";
import { LayoutGrid, Pencil, User } from "lucide-react";
import { AWS_BASE_URL } from "@/lib/consts";

// 컬렉션 카드용 인터페이스
interface CollectionPreview {
  id: string;
  href: string;
  title: string;
  count: number;
  thumbnail: string | null;
}

export default function MyProfilePage() {
  const router = useRouter();

  const [profileInfo, setProfileInfo] = useState<ProfileInfo>({
    nickname: "",
    profileImageUrl: "",
  });
  const [data, setData] = useState<CollectionPreview[]>([]);
  const [isReady, setIsReady] = useState(false);

  const loadProfileData = async () => {
    try {
      const res = await getProfileInfoAPI();

      if (res.code === 202) {
        setProfileInfo({
          ...res.data,
          profileImageUrl: AWS_BASE_URL + res.data.profileImageKey,
        });
      }

      // 2. [수정] 데이터를 "내 업로드", "내 좋아요", "내 컬렉션" 3개로 고정
      const mockCollections: CollectionPreview[] = [
        {
          id: "uploads",
          href: "/mypage/uploads", // (예시 경로)
          title: "내 업로드",
          count: 3,
          thumbnail: "https://placehold.co/600x400/E2E8F0/333?text=Image+1",
        },
        {
          id: "likes",
          href: "/mypage/likes", // (예시 경로)
          title: "내 좋아요",
          count: 9,
          thumbnail: "https://placehold.co/400x600/D1FAE5/333?text=Image+2",
        },
        {
          id: "collection1",
          href: "/mypage/collections", // (예시 경로)
          title: "내 컬렉션",
          count: 12,
          thumbnail: "https://placehold.co/800x600/FEF9C3/333?text=Image+3",
        },
        // (참고: 빈 컬렉션 테스트용)
        // {
        //   id: "empty",
        //   href: "/collection/empty",
        //   title: "빈 컬렉션",
        //   count: 0,
        //   thumbnail: null,
        // },
      ];
      setData(mockCollections);

      setIsReady(true);
    } catch (error) {
      console.log(error);
      alert(error.message);
      setIsReady(true);
    }
  };

  useEffect(() => {
    loadProfileData();
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
            priority={true}
            className="w-32 h-32 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-[140] h-[140] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            <User size={80} className="text-gray-500" />
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
        {data.length === 0 ? (
          <div className="text-center mt-10 border rounded py-10 px-4 text-gray-600">
            <p className="text-lg mb-2">업로드나 컬렉션이 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            {data.map((collection) => (
              <Link href={collection.href} key={collection.id} className="w-full sm:w-60 md:w-72">
                <div className="relative aspect-square rounded-lg overflow-hidden border shadow-sm transition-all hover:shadow-md">
                  {collection.count === 0 || !collection.thumbnail ? (
                    // 콘텐츠 없음 상태
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center p-4">
                      <p className="text-gray-500 text-center">콘텐츠가 없습니다</p>
                    </div>
                  ) : (
                    // 썸네일 이미지
                    <Image
                      src={collection.thumbnail}
                      alt={collection.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 33vw, 25vw"
                    />
                  )}
                </div>
                {/* 카드 하단 정보 */}
                <div className="flex justify-between items-center text-base mt-2 px-1">
                  <span className="font-semibold text-gray-800">{collection.title}</span>
                  <div className="flex items-center gap-1 text-gray-600">
                    <LayoutGrid size={16} />
                    <span className="font-medium">{collection.count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
