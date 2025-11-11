"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Download, Heart, Star, Check, UserPlus } from "lucide-react";
import Slideshow from "@/components/Slideshow";

interface MediaDetail {
  id: string;
  type: "IMAGE" | "ALBUM" | "VIDEO";
  imageUrl?: string; // [수정] 이미지는 선택 사항
  videoUrl?: string; // [수정] 비디오도 선택 사항
  width: number; // [신규] 렌더링 최적화를 위한 원본 너비
  height: number; // [신규] 렌더링 최적화를 위한 원본 높이
  title: string;
  description: string;
  tags: string[];
  user: {
    name: string;
    handle: string;
    avatarUrl: string;
  };
}

async function getMediaDetails(id: string): Promise<MediaDetail | null> {
  console.log(`Fetching details for ID: ${id}...`);

  // [신규] 다양한 비율의 데이터를 포함하는 모의 데이터베이스
  const mockDatabase = new Map<string, MediaDetail>();

  // 데이터 1: 가로 이미지 (기존)
  mockDatabase.set("image-landscape", {
    id: "image-landscape",
    type: "IMAGE",
    imageUrl:
      "https://images.unsplash.com/photo-1544198365-f5d60b6d8190?q=80&w=2070&auto=format&fit=crop",
    width: 2070,
    height: 1380, // 3:2
    title: "Exploring the Serene Alps",
    description:
      "A breathtaking journey through the Swiss Alps, capturing the tranquil beauty of the mountains and crystal-clear lakes.",
    tags: ["alps", "switzerland", "landscape"],
    user: {
      name: "Alex Doe",
      handle: "@alexdoe_photos",
      avatarUrl: "https://placehold.co/100x100/FFD1B9/522B09?text=AD",
    },
  });

  // 데이터 2: 세로 이미지
  mockDatabase.set("image-portrait", {
    id: "image-portrait",
    type: "IMAGE",
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070&auto=format&fit=crop",
    width: 2070,
    height: 3105, // 2:3
    title: "Vertical Waves",
    description:
      "A drone shot capturing the mesmerizing patterns of waves crashing on a tropical beach.",
    tags: ["beach", "ocean", "drone", "vertical"],
    user: {
      name: "Jane Doe",
      handle: "@janedoe_photos",
      avatarUrl: "https://placehold.co/100x100/E2E8F0/333?text=JD",
    },
  });

  // 데이터 3: 정사각형 이미지
  mockDatabase.set("image-square", {
    id: "image-square",
    type: "IMAGE",
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1780&auto=format&fit=crop",
    width: 1780,
    height: 1780, // 1:1
    title: "Healthy Bowl",
    description: "A vibrant and healthy poke bowl, perfect for a fresh meal.",
    tags: ["food", "healthy", "poke", "square"],
    user: {
      name: "Foodie Alex",
      handle: "@foodiealex",
      avatarUrl: "https://placehold.co/100x100/D1FAE5/064E3B?text=FA",
    },
  });

  // 데이터 4: 가로 비디오 (기존)
  mockDatabase.set("video-landscape", {
    id: "video-landscape",
    type: "VIDEO",
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    width: 1920,
    height: 1080, // 16:9
    title: "Big Buck Bunny",
    description: "A short animated film by the Blender Foundation.",
    tags: ["animation", "blender", "funny"],
    user: {
      name: "Alex Doe",
      handle: "@alexdoe_photos",
      avatarUrl: "https://placehold.co/100x100/FFD1B9/522B09?text=AD",
    },
  });

  // 데이터 5: 세로 비디오 (Tears of Steel 썸네일 예시 - 실제론 가로 영상)
  // (참고: 실제 9:16 비디오 URL은 테스트용으로 구하기 어렵습니다)
  mockDatabase.set("video-portrait", {
    id: "video-portrait",
    type: "VIDEO",
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    width: 1080,
    height: 1920, // 9:16 (데이터상 비율)
    title: "Portrait Video Test (Tears of Steel)",
    description:
      "Simulating a portrait video (9:16) using a landscape source. This tests how a tall video fits the player.",
    tags: ["test", "portrait", "vfx"],
    user: {
      name: "Tech Lead",
      handle: "@techlead",
      avatarUrl: "https://placehold.co/100x100/E0E7FF/312E81?text=TL",
    },
  });

  await new Promise((res) => setTimeout(res, 100));

  // [수정] ID로 데이터베이스에서 조회하여 반환
  return mockDatabase.get(id) || null;
}

// 3. (메인 페이지 컴포넌트)
export default function ContentDetailPage() {
  const params = useParams();
  //const id = params.id as string;

  // for test
  //const id = "image-portrait";
  const id = "image-square";
  //const id = "video-landscape";
  //const id = "video-portrait";

  const [mediaDetail, setMediaDetail] = useState<MediaDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [showSlideshow, setShowSlideshow] = useState(false);

  // [수정] 데이터 페칭 (URL의 ID를 사용)
  useEffect(() => {
    if (!id) return; // ID가 없으면 로드하지 않음

    async function loadData() {
      setIsLoading(true);
      const data = await getMediaDetails(id); // URL의 id로 데이터 요청
      setMediaDetail(data);
      setIsExpanded(false);
      setIsLoading(false);
    }
    loadData();
  }, [id]);

  // [신규] 3. 슬라이드쇼 열기 핸들러
  const onOpenSlideshow = () => {
    // 이미지만 슬라이드쇼를 엽니다.
    if (mediaDetail.type === "IMAGE") {
      setShowSlideshow(true);
    }
  };

  // 로딩 및 404
  if (isLoading) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </main>
    );
  }
  if (!mediaDetail) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 pt-16">
        <h1 className="text-2xl font-bold text-gray-800">404 - 콘텐츠를 찾을 수 없습니다.</h1>
        <p className="text-gray-600 mt-2">
          `contents/[id]` 경로에서 ID를 확인하세요. (예: /contents/image-landscape)
        </p>
      </main>
    );
  }

  // 설명 텍스트 로직
  const description = mediaDetail.description;
  const isLongDescription = description.length > 300;
  const truncatedDescription = isLongDescription
    ? description.substring(0, 300) + "..."
    : description;

  const mediaClassName = "w-full h-auto object-contain max-h-[80vh] min-h-[30vh]";

  return (
    <main className="w-full min-h-[calc(100vh-56px)]">
      <div className="container mx-auto px-5 py-5">
        <div className="flex w-full flex-col overflow-hidden rounded-xl bg-white shadow-xl">
          {/* 이미지/비디오 렌더링 영역 */}
          <div className="flex w-full max-h-screen items-center justify-center">
            {mediaDetail.type === "IMAGE" && mediaDetail.imageUrl && (
              <div onClick={onOpenSlideshow} className="cursor-pointer">
                <Image
                  src={mediaDetail.imageUrl}
                  alt={mediaDetail.title}
                  width={mediaDetail.width}
                  height={mediaDetail.height}
                  className={mediaClassName}
                  priority
                />
              </div>
            )}

            {mediaDetail.type === "VIDEO" && mediaDetail.videoUrl && (
              <video
                // 비디오 비율에 맞게 스타일 적용 (object-contain)
                className={mediaClassName}
                src={mediaDetail.videoUrl}
                controls
                playsInline
                preload="metadata"
                // 세로 비디오가 9:16일 때 가로를 채우지 않도록 처리
                style={{
                  width: mediaDetail.width > mediaDetail.height ? "100%" : "auto",
                  height: mediaDetail.width > mediaDetail.height ? "auto" : "100%",
                }}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>

          {/* 정보 영역 */}
          <div className="flex w-full flex-col gap-6 p-6 md:p-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                  {mediaDetail.title}
                </h1>
                <div className="flex-shrink-0 flex space-x-2 ml-4">
                  <button className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-600">
                    <Download size={20} />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors
                      ${
                        isLiked
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => setIsCollected(!isCollected)}
                    className={`flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors
                      ${
                        isCollected
                          ? "border-yellow-500 bg-yellow-500 text-white"
                          : "border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <Star
                      size={20}
                      fill={isCollected ? "currentColor" : "none"}
                      strokeWidth={1.5}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* 유저 정보 */}
            <div className="flex flex-shrink-0 items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src={mediaDetail.user.avatarUrl}
                  alt={mediaDetail.user.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <p className="text-base font-bold text-gray-900">{mediaDetail.user.name}</p>
                  <p className="text-sm text-gray-500">{mediaDetail.user.handle}</p>
                </div>
              </div>
              {/* 팔로우 기능은 추후 추가 */}
              {/* <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors
                  ${
                    isFollowing
                      ? "bg-gray-200 text-gray-700"
                      : "bg-gray-900 text-white hover:bg-gray-700"
                  }`}
              >
                {isFollowing ? (
                  <span className="flex items-center gap-1">
                    <Check size={16} /> Following
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <UserPlus size={16} /> Follow
                  </span>
                )}
              </button> */}
            </div>

            {/* 설명 */}
            <div className="space-y-3">
              <p className="text-base text-gray-600 whitespace-pre-line">
                {isExpanded ? description : truncatedDescription}
                {!isExpanded && isLongDescription && (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="ml-2 font-semibold text-blue-500 hover:text-blue-700"
                  >
                    ...more
                  </button>
                )}
              </p>
            </div>

            {/* 태그 */}
            <div className="flex flex-wrap gap-2">
              {mediaDetail.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showSlideshow && mediaDetail.type === "IMAGE" && mediaDetail.imageUrl && (
        <Slideshow
          images={[{ src: mediaDetail.imageUrl, name: mediaDetail.title }]}
          startIndex={0}
          onClose={() => setShowSlideshow(false)}
        />
      )}
    </main>
  );
}
