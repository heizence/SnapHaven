"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Photo } from "react-photo-album";
import Slideshow from "@/components/Slideshow";

import RenderAlbum from "@/components/RenderAlbum";
import UserInfoArea from "@/components/ui/UserInfoArea";
import ContentDesc from "@/components/ui/ContentDesc";
import { TagButtons } from "@/components/ui/TagButton";
import { DownloadBtn } from "@/components/ui/DownloadBtn";
import { LikeButton } from "@/components/ui/LikeButton";
import { AddToCollectionBtn } from "@/components/ui/AddToCollectionBtn";

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
        console.log("firstPageItems: ", firstPageItems);
        setDisplayedItems(firstPageItems);
        setPage(2);
        setHasMore(firstPageItems.length < data.images.length);
      }

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

  if (!albumDetail) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 pt-16">
        <h1 className="text-2xl font-bold text-gray-800">404 - 앨범을 찾을 수 없습니다.</h1>
        <p className="text-gray-600 mt-2">(예: /album/seoul-autumn)</p>
      </main>
    );
  }

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
    <main className="w-full h-full py-5">
      <div className="container mx-auto">
        {/* 앨범은 단일 카드 안에 정보와 그리드를 모두 포함 */}
        <div className="flex w-full flex-col overflow-hidden rounded-xl">
          <div className="flex w-full flex-col gap-6 p-6 md:p-8">
            <div className="flex items-start justify-between">
              {/* 제목 */}
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {albumDetail.title}
              </h1>

              {/* 액션 버튼 */}
              <div className="flex items-center space-x-2">
                <DownloadBtn title="앨범 전체 ZIP 다운로드" onClick={() => {}} />

                <LikeButton isLiked={true} />
                <AddToCollectionBtn isCollected={true} />
              </div>
            </div>
            {/* 유저 정보 */}
            <UserInfoArea
              avatarUrl={albumDetail.user.avatarUrl}
              name={albumDetail.user.name}
              uploadedDate="2025.11.14"
            />
            {/* 설명 */}
            <ContentDesc description={albumDetail.description || ""} />
            {/* 총 갯수 */}
            <p className="font-semibold text-gray-700">총 {photos.length}장</p>
            {/* 태그 */}
            <TagButtons tagsArray={albumDetail.tags} />
          </div>

          <div className="py-2 md:py-6 md:pt-0">
            <RenderAlbum photos={displayedItems} onClick={({ index }) => onOpenSlideshow(index)} />
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
