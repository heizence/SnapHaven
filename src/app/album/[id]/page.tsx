"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Download, Heart, Star, Check, UserPlus } from "lucide-react";
import { MasonryPhotoAlbum, Photo } from "react-photo-album";
import "react-photo-album/masonry.css";
import Slideshow from "@/components/Slideshow";

interface AlbumDetail {
  id: string;
  type: "ALBUM";
  images: Photo[];
  title: string;
  description: string;
  tags: string[];
  user: {
    name: string;
    handle: string;
    avatarUrl: string;
  };
}

const PAGE_LIMIT = 20;

async function getAlbumDetails(id: string): Promise<AlbumDetail | null> {
  console.log(`Fetching ALUBM details for ID: ${id}...`);

  // 앨범용 목 데이터 생성기
  const generateAlbumImages = (count = 1000): Photo[] => {
    const images: Photo[] = [];
    const ratios = [
      [600, 400],
      [400, 600],
      [800, 600],
      [600, 800],
      [500, 500],
      [1280, 720],
      [720, 1280],
      [1000, 500],
    ];
    const randomColor = () =>
      ["E2E8F0", "FBCFE8", "E0E7FF", "D1FAE5"][Math.floor(Math.random() * 4)];

    for (let i = 1; i <= count; i++) {
      const [width, height] = ratios[i % ratios.length];
      images.push({
        src: `https://placehold.co/${width}x${height}/${randomColor()}/333?text=Image+${i}`,
        width: width,
        height: height,
        key: `${id}-image-${i}`,
      });
    }
    return images;
  };

  // 모의 데이터베이스
  const mockDatabase = new Map<string, AlbumDetail>();

  mockDatabase.set("seoul-autumn", {
    id: "seoul-autumn",
    type: "ALBUM",
    images: generateAlbumImages(), // 12장의 이미지 생성
    title: "서울숲의 가을",
    description:
      "가을이 절정에 달했을 때 서울숲의 다채로운 색감과 평화로운 분위기를 담은 사진 모음입니다. 모든 사진은 Sony A7III로 촬영되었으며, 계절의 아름다움을 최대한 살리기 위해 다양한 각도와 빛 조건을 탐색했습니다.",
    tags: ["풍경", "서울", "야경", "가을", "SonyA7III"],
    user: {
      name: "Photography_Lover",
      handle: "3일 전 업로드",
      avatarUrl:
        "https://images.unsplash.com/photo-1544198365-f5d60b6d8190?q=80&w=2070&auto=format&fit=crop",
    },
  });

  await new Promise((res) => setTimeout(res, 100));
  // ID로 조회하여 앨범 데이터만 반환 (다른 타입은 없음)
  return mockDatabase.get(id) || null;
}

// 3. (메인 페이지 컴포넌트)
export default function CollectionDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [albumDetail, setAlbumDetail] = useState<AlbumDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayedItems, setDisplayedItems] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [showSlideshow, setShowSlideshow] = useState(false);
  const [startIndex, setStartIndex] = useState(0); // 클릭한 이미지 인덱스

  // 데이터 페칭
  // 데이터 페칭 (기존과 동일)
  useEffect(() => {
    if (!id) return;
    async function loadData() {
      setIsLoading(true);
      const data = await getAlbumDetails(id);
      setAlbumDetail(data);
      if (data && data.images) {
        const firstPageItems = data.images.slice(0, PAGE_LIMIT);
        setDisplayedItems(firstPageItems);
        setPage(2);
        setHasMore(firstPageItems.length < data.images.length);
      }
      setIsExpanded(false);
      setIsLoading(false); // [정상] 'isLoading'만 해제
    }
    loadData();
  }, [id]);

  // "더 보기" 핸들러 (기존과 동일)
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || !albumDetail || !albumDetail.images || isLoading) return;
    setIsLoadingMore(true); // [정상] 'isLoadingMore' 사용

    const start = (page - 1) * PAGE_LIMIT;
    const end = page * PAGE_LIMIT;
    const newItems = albumDetail.images.slice(start, end);

    setTimeout(() => {
      setDisplayedItems((prev) => [...prev, ...newItems]);
      setPage((prev) => prev + 1);
      setHasMore(end < albumDetail.images.length);
      setIsLoadingMore(false); // [정상] 'isLoadingMore' 해제
    }, 500);
  }, [isLoadingMore, hasMore, page, albumDetail, isLoading]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.offsetHeight
      ) {
        handleLoadMore();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleLoadMore]);

  // 로딩 및 404
  if (isLoading) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-gray-100 pt-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </main>
    );
  }
  if (!albumDetail) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 pt-16">
        <h1 className="text-2xl font-bold text-gray-800">404 - 앨범을 찾을 수 없습니다.</h1>
        <p className="text-gray-600 mt-2">(예: /album/seoul-autumn)</p>
      </main>
    );
  }

  // 설명 텍스트 로직
  const description = albumDetail.description;
  const isLongDescription = description.length > 300;
  const truncatedDescription = isLongDescription
    ? description.substring(0, 300) + "..."
    : description;

  const photos = albumDetail.images;

  // 슬라이드쇼 열기 핸들러
  const onOpenSlideshow = (index: number) => {
    setStartIndex(index);
    setShowSlideshow(true);
  };

  // 슬라이드쇼용 이미지 데이터 포맷팅
  const slideshowImages = photos.map((photo) => ({
    src: photo.src,
    name: photo.key, // 또는 다른 이름
  }));

  // --- 앨범 레이아웃 렌더링 ---
  return (
    <main className="w-full min-h-[calc(100vh-56px)] px-5">
      <div className="container mx-auto py-5">
        {/* 앨범은 단일 카드 안에 정보와 그리드를 모두 포함 */}
        <div className="flex w-full flex-col overflow-hidden rounded-xl bg-white shadow-xl">
          {/* 1. 앨범 정보 영역 */}
          <div className="flex w-full flex-col gap-6 p-6 md:p-8">
            {/* 유저 정보 */}
            <div className="flex flex-shrink-0 items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src={albumDetail.user.avatarUrl}
                  alt={albumDetail.user.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <p className="text-base font-bold text-gray-900">{albumDetail.user.name}</p>
                  <p className="text-sm text-gray-500">{albumDetail.user.handle}</p>
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

            {/* 제목 */}
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{albumDetail.title}</h1>

            {/* 설명 (...more 포함) */}
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

            {/* 총 갯수 */}
            <p className="font-semibold text-gray-700">총 {photos.length}장</p>

            {/* 태그 */}
            <div className="flex flex-wrap gap-2">
              {albumDetail.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center space-x-2">
              <button className="flex flex-grow max-w-[220px] items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-600 md:flex-grow-0">
                <Download size={20} />
                <span>앨범 전체 ZIP 다운로드</span>
              </button>
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors
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
                <Star size={20} fill={isCollected ? "currentColor" : "none"} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* 2. 앨범 그리드 영역 */}
          <div className="p-2 md:p-6 md:pt-0">
            {/* 그리드 영역 패딩 */}
            <MasonryPhotoAlbum
              photos={displayedItems}
              // [핵심] pager.tsx에서 가져온 설정 (메인 페이지와 동일한 Masonry)
              columns={(containerWidth) => {
                if (containerWidth < 600) return 2;
                if (containerWidth < 1500) return 3;
                return 4;
              }}
              spacing={8} // 8px (tailwind gap-2)
              padding={0}
              targetRowHeight={150}
              rowConstraints={{ singleRowMaxHeight: 250 }}
              onClick={({ index }) => onOpenSlideshow(index)} // 클릭 시 핸들러 호출
            />
          </div>
        </div>
      </div>

      {showSlideshow && (
        <Slideshow
          images={slideshowImages}
          startIndex={startIndex}
          onClose={() => setShowSlideshow(false)}
        />
      )}
    </main>
  );
}
