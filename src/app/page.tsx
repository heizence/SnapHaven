"use client";

import { useState, useEffect } from "react";
import { MasonryPhotoAlbum } from "react-photo-album";
import "react-photo-album/masonry.css";
import { useRouter } from "next/navigation";

// 1. (데이터 타입 정의) - (기존과 동일)
interface MediaItemDto {
  id: number;
  type: "IMAGE" | "VIDEO";
  title: string;
  urls: {
    small: string; // [중요] 비디오 타입도 이 URL을 사용합니다.
    medium: string;
    large: string;
  };
  width: number;
  height: number;
}

// 2. [수정됨] 200개의 전체 목(Mock) 데이터를 생성하는 함수 (getMediaDatabase)
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

  for (let i = 1; i <= 200; i++) {
    const [width, height] = ratios[i % ratios.length];
    const type = Math.random() > 0.3 ? "IMAGE" : "VIDEO";
    const title = `${type === "IMAGE" ? "Image" : "Video"} ${i} (${width}x${height})`;

    // [수정] 비디오도 플레이스홀더 URL을 생성하도록 변경
    const smallUrl = `https://placehold.co/${width}x${height}/${randomColor(type)}/${textColor(
      type
    )}?text=Item+${i}`;

    mockData.push({
      id: i,
      type: type,
      title: title,
      // [수정] 비디오도 smallUrl을 갖게 됨
      urls: { small: smallUrl, medium: "", large: "" },
      width: width,
      height: height,
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockData;
}

type FilterType = "ALL" | "IMAGE" | "VIDEO";
const PAGE_LIMIT = 20; // 한 번에 20개씩 불러오기

// 3. (메인 페이지 컴포넌트)
export default function HomePage() {
  // [기존과 동일] 무한 스크롤을 위한 State
  const [allMedia, setAllMedia] = useState<MediaItemDto[]>([]);
  const [displayedItems, setDisplayedItems] = useState<MediaItemDto[]>([]);
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const router = useRouter();

  // [기존과 동일] 1. DB 로드
  useEffect(() => {
    async function loadDatabase() {
      setIsInitialLoad(true);
      const data = await getMediaDatabase();
      console.log("### data : ", data);
      setAllMedia(data);
      setIsInitialLoad(false);
    }
    loadDatabase();
  }, []);

  // [기존과 동일] 2. 필터 변경 시 첫 페이지 로드
  useEffect(() => {
    if (allMedia.length === 0 && !isInitialLoad) return;
    if (!isInitialLoad) setIsLoading(true);

    const filteredDb = allMedia.filter((item) => {
      if (filterType === "ALL") return true;
      return item.type === filterType;
    });

    const firstPageItems = filteredDb.slice(0, PAGE_LIMIT);

    const timer = setTimeout(() => {
      setDisplayedItems(firstPageItems);
      setPage(2);
      setHasMore(firstPageItems.length < filteredDb.length);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [filterType, allMedia, isInitialLoad]);

  // [기존과 동일] 3. "더 보기" 버튼 (무한 스크롤)
  const handleLoadMore = () => {
    if (isLoading || !hasMore) return;

    const filteredDb = allMedia.filter((item) => {
      if (filterType === "ALL") return true;
      return item.type === filterType;
    });

    const start = (page - 1) * PAGE_LIMIT;
    const end = page * PAGE_LIMIT;
    const newItems = filteredDb.slice(start, end);

    setTimeout(() => {
      setDisplayedItems((prev) => [...prev, ...newItems]);
      setPage((prev) => prev + 1);
      setHasMore(end < filteredDb.length);
      setIsLoading(false);
    }, 500);
  };

  // [신규] 'react-photo-album'이 요구하는 형식으로 데이터 매핑
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
    <main className="w-full py-5">
      {/* 필터 버튼 UI (기존과 동일) */}
      <div className="flex justify-center space-x-2 sm:space-x-4 mb-8">
        {[
          { key: "ALL", label: "전체" },
          { key: "IMAGE", label: "사진" },
          { key: "VIDEO", label: "영상" },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setFilterType(filter.key as FilterType)}
            className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-full font-semibold text-sm sm:text-base transition-colors duration-200 ease-in-out
              ${
                filterType === filter.key
                  ? "bg-black text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
              }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* [핵심] 'Masonry' -> 'PhotoAlbum'으로 교체 */}
      {(isInitialLoad || (!isLoading && photos.length > 0)) && (
        <MasonryPhotoAlbum
          photos={photos}
          columns={(containerWidth) => {
            if (containerWidth < 600) return 2; // 너비가 600px 미만일 때 2열
            if (containerWidth < 1500) return 3; // 너비가 600px 이상, 1000px 미만일 때 3열
            return 4; // 너비가 1500px 이상일 때 4열
          }}
          spacing={2} // 사진 사이 간격 (선택 사항)
          padding={2} // 앨범 컨테이너 내부 여백 (선택 사항)
          targetRowHeight={150}
          rowConstraints={{ singleRowMaxHeight: 250 }}
          onClick={({ index }) => {
            router.push(`/contents/${index}`);
          }}
        />
      )}

      {/* [신규] 로딩 스피너 및 "더 보기" 버튼 (기존과 동일) */}
      <div className="flex justify-center py-10">
        {isLoading && !isInitialLoad && (
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 dark:border-gray-100"></div>
        )}

        {!isLoading && hasMore && (
          <button
            onClick={handleLoadMore}
            className="px-6 py-3 rounded-full bg-black text-white font-semibold shadow-md hover:bg-gray-800 transition-colors"
          >
            더 보기
          </button>
        )}

        {!hasMore && displayedItems.length > 0 && (
          <p className="text-gray-500">모든 콘텐츠를 불러왔습니다.</p>
        )}
      </div>

      {/* 빈 결과 메시지 (기존과 동일) */}
      {!isInitialLoad && !isLoading && displayedItems.length === 0 && (
        <p className="text-center text-gray-500 py-20">
          {filterType === "ALL"
            ? "표시할 미디어가 없습니다."
            : `표시할 ${filterType === "IMAGE" ? "사진" : "영상"}이(가) 없습니다.`}
        </p>
      )}
    </main>
  );
}
