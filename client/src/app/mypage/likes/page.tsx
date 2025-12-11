"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import "react-photo-album/masonry.css";
import RenderContents from "@/components/RenderContents";
import NoDataMessage from "@/components/ui/NoDataMessage";

interface MediaItemDto {
  id: number;
  type: "IMAGE" | "VIDEO";
  title: string;
  urls: {
    small: string;
    medium: string;
    large: string;
  };
  width: number;
  height: number;
}

const PAGE_LIMIT = 20; // 한 번에 20개씩 로드

// 3. [수정] 더미 데이터 생성 함수 (width, height 포함)
async function getMediaDatabase(): Promise<MediaItemDto[]> {
  console.log("Fetching media database... (using extended mock data generator)");

  const mockData: MediaItemDto[] = [];
  const ratios = [
    [600, 400],
    [400, 600],
    [800, 600],
    [600, 800],
    [500, 500],
    [800, 800],
    [1280, 720],
    [720, 1280],
    [1920, 1080],
    [1080, 1920],
    [800, 1000],
    [1000, 800],
    [500, 1083],
    [450, 1000],
    [1000, 500],
    [1200, 400],
    [1280, 800],
    [800, 1280],
  ];

  const randomColor = (type: "IMAGE" | "VIDEO") => {
    // 이미지는 밝은 색, 비디오는 어두운 색
    const imgColors = ["E2E8F0", "FBCFE8", "F3E8FF", "E0E7FF", "D1FAE5"];
    const vidColors = ["333", "1F2937", "064E3B", "312E81", "581C87"];
    const colors = type === "IMAGE" ? imgColors : vidColors;
    return colors[Math.floor(Math.random() * colors.length)];
  };
  const textColor = (type: "IMAGE" | "VIDEO") => {
    return type === "IMAGE" ? "333" : "CCC";
  };

  for (let i = 1; i <= 50; i++) {
    const [width, height] = ratios[i % ratios.length];
    const type = Math.random() > 0.3 ? "IMAGE" : "VIDEO";
    const title = `${type === "IMAGE" ? "Image" : "Video"} ${i} (${width}x${height})`;

    // 비디오도 플레이스홀더 URL을 생성하도록 변경
    const smallUrl = `https://placehold.co/${width}x${height}/${randomColor(type)}/${textColor(
      type
    )}?text=Item+${i}`;

    mockData.push({
      id: i,
      type: type,
      title: title,
      urls: { small: smallUrl, medium: "", large: "" },
      width: width,
      height: height,
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockData;
}

// 4. [수정] 메인 페이지 컴포넌트
export default function MyLikedContentsPage() {
  const [allMedia, setAllMedia] = useState<MediaItemDto[]>([]);
  const [displayedItems, setDisplayedItems] = useState<MediaItemDto[]>([]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false); // "더 보기" 전용
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const router = useRouter();

  // DB 로드
  useEffect(() => {
    async function loadDatabase() {
      setIsInitialLoad(true);
      const data = await getMediaDatabase();
      setAllMedia(data);
      setIsInitialLoad(false);
    }
    loadDatabase();
  }, []);

  // 필터 변경 시 첫 페이지 로드
  useEffect(() => {
    if (allMedia.length === 0 && !isInitialLoad) return;
    if (!isInitialLoad) setIsLoading(true);

    const filteredDb = allMedia.filter((item) => {
      return true;
    });

    const firstPageItems = filteredDb.slice(0, PAGE_LIMIT);
    const timer = setTimeout(() => {
      setDisplayedItems(firstPageItems);
      //setDisplayedItems([]);
      setPage(2);
      setHasMore(firstPageItems.length < filteredDb.length);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [allMedia, isInitialLoad]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore || isInitialLoad) return;
    setIsLoadingMore(true);

    const filteredDb = allMedia.filter((item) => {
      return true;
    });

    const start = (page - 1) * PAGE_LIMIT;
    const end = page * PAGE_LIMIT;
    const newItems = filteredDb.slice(start, end);

    setTimeout(() => {
      setDisplayedItems((prev) => [...prev, ...newItems]);
      setPage((prev) => prev + 1);
      setHasMore(end < filteredDb.length);
      setIsLoadingMore(false);
    }, 500);
  }, [isLoading, isLoadingMore, hasMore, page, allMedia, isInitialLoad]); // [수정] 의존성 추가

  useEffect(() => {
    const handleScroll = () => {
      // 일정 구간 스크롤이 내려가면 버튼을 보여준다.
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.offsetHeight
      ) {
        handleLoadMore();
      }
    };

    // window에 scroll 이벤트를 넣는다.
    window.addEventListener("scroll", handleScroll);

    // 페이지를 벗어날 때 이벤트를 제거한다.
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleLoadMore]);

  // 'react-photo-album'이 요구하는 형식으로 데이터 매핑
  // [중요] DTO에 type과 title을 추가로 전달합니다.
  const photos = displayedItems.map((item) => ({
    src: item.urls.small,
    width: item.width,
    height: item.height,
    // --- 라이브러리가 모르는 추가 정보 전달 ---
    key: item.id,
    type: item.type,
    title: item.title,
  }));

  return (
    <main className="w-full h-full py-5">
      <div className="container mx-auto">
        <div className="flex w-full flex-col">
          {/* 헤더 영역 */}
          <div className="p-6 md:p-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">내 좋아요</h1>
          </div>

          <div className="py-6 md:py-8">
            <RenderContents
              photos={photos}
              onClick={({ index }) => router.push(`/content/${index}`)}
            />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <NoDataMessage
          message="콘텐츠가 없습니다"
          show={!isInitialLoad && !isLoading && !isLoadingMore && displayedItems.length === 0}
        />
      </div>

      <NoDataMessage
        message="모든 콘텐츠를 불러왔습니다."
        show={!isLoading && !isLoadingMore && !hasMore && displayedItems.length > 0}
      />
    </main>
  );
}
