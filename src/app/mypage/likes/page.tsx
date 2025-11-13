"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MasonryPhotoAlbum, Photo } from "react-photo-album";
import "react-photo-album/masonry.css";

// [수정] 2. 인터페이스에 width, height 추가 (Photo 타입 호환용)
interface UploadItem extends Photo {
  id: string; // 콘텐츠 ID
  type: "image" | "album" | "video"; // 콘텐츠 타입
  title: string; // 콘텐츠 제목 (예시)
}

const PAGE_LIMIT = 20; // 한 번에 20개씩 로드

// 3. [수정] 더미 데이터 생성 함수 (width, height 포함)
async function getMyUploadsAPI(): Promise<UploadItem[] | null> {
  console.log("Fetching My Uploads... (using DUMMY data)");

  const generateDummyUploads = (count: number): UploadItem[] => {
    const items: UploadItem[] = [];
    // 메인 페이지와 동일한 비율 사용
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
    const titles = ["풍경", "동물", "음식", "인물", "건축"];

    for (let i = 0; i < count; i++) {
      const randomColor = ["E2E8F0", "FBCFE8", "E0E7FF", "D1FAE5", "FFFBEB"][
        Math.floor(Math.random() * 5)
      ];
      const randomType: "image" | "album" | "video" = i % 3 === 0 ? "album" : "image";
      const [width, height] = ratios[i % ratios.length]; // [신규] width, height 추가

      items.push({
        id: `content-${i + 1}`,
        type: randomType,
        // [수정] src에 width, height 적용
        src: `https://placehold.co/${width}x${height}/${randomColor}/333?text=Content+${i + 1}`,
        title: `${titles[i % titles.length]} ${i + 1}`,
        width: width, // [신규]
        height: height, // [신규]
        key: `upload-item-${i + 1}`, // [신규] Photo 키
      });
    }
    return items;
  };

  await new Promise((res) => setTimeout(res, 300));
  return generateDummyUploads(50); // 20개의 더미 업로드 아이템
}

// 4. [수정] 메인 페이지 컴포넌트
export default function MyUploadsPage() {
  const [uploadsData, setUploadsData] = useState<UploadItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [displayedItems, setDisplayedItems] = useState<UploadItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const router = useRouter();

  // 데이터 페칭
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await getMyUploadsAPI();
      setUploadsData(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || !uploadsData || isLoading) return;
    setIsLoadingMore(true);

    const start = (page - 1) * PAGE_LIMIT;
    const end = page * PAGE_LIMIT;
    const newItems = uploadsData.slice(start, end);

    setTimeout(() => {
      setDisplayedItems((prev) => [...prev, ...newItems]);
      setPage((prev) => prev + 1);
      setHasMore(end < uploadsData.length);
      setIsLoadingMore(false);
    }, 500);
  }, [isLoadingMore, hasMore, page, uploadsData, isLoading]);

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

  // [유지] 로딩 예외 페이지
  if (isLoading) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-white pt-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </main>
    );
  }

  // [유지] 404 예외 페이지
  if (!uploadsData) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-white pt-16">
        <h1 className="text-2xl font-bold text-gray-800">업로드한 내역을 불러올 수 없습니다.</h1>
      </main>
    );
  }

  // [신규] 5. MasonryPhotoAlbum의 renderPhoto 함수 (Link 적용)
  const renderPhoto = ({
    photo, // photo는 UploadItem 타입과 호환됨
    wrapperStyle,
    imageProps: { src, alt, style, ...restImageProps },
  }: any) => {
    // 클릭 시 이동할 경로 설정
    const href = photo.type === "album" ? `/album/${photo.id}` : `/contents/${photo.id}`;

    return (
      // Link 컴포넌트로 래핑
      <Link href={href} style={wrapperStyle} className="outline-none group cursor-pointer">
        <img
          src={src}
          alt={alt}
          style={{ ...style, width: "100%", height: "auto" }}
          {...restImageProps}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        {/* (옵션: hover 시 콘텐츠 제목 등 정보 표시) */}
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-3 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="text-sm font-semibold">{photo.title}</span>
        </div>
      </Link>
    );
  };

  // --- "내 업로드" 레이아웃 렌더링 ---
  return (
    <main className="w-full min-h-[calc(100vh-56px)] bg-white px-5">
      <div className="container mx-auto py-5">
        <div className="flex w-full flex-col rounded-xl bg-white">
          {/* 1. [유지] 헤더 영역 */}
          <div className="p-6 md:p-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">내 좋아요</h1>
          </div>

          {/* 2. [수정] 그리드 영역 -> MasonryPhotoAlbum으로 변경 */}
          <div className="p-6 md:p-8">
            {uploadsData.length === 0 ? (
              <div className="text-center py-10 text-gray-600">
                <p className="text-lg mb-2">아직 업로드한 콘텐츠가 없습니다.</p>
                <Link href="/upload" className="text-blue-600 hover:underline">
                  새로운 콘텐츠 업로드하기
                </Link>
              </div>
            ) : (
              // [수정] MasonryPhotoAlbum 컴포넌트 사용
              <MasonryPhotoAlbum
                photos={displayedItems} // UploadItem[]이 Photo[]와 호환됨
                // 메인 페이지/앨범 페이지와 동일한 컬럼 설정
                columns={(containerWidth) => {
                  if (containerWidth < 600) return 2;
                  if (containerWidth < 1500) return 3;
                  return 4;
                }}
                spacing={8}
                padding={0}
                targetRowHeight={150}
                rowConstraints={{ singleRowMaxHeight: 250 }}
                // [신규] renderPhoto prop을 전달하여 Link 래핑 및 포커스 링 제거
                renderPhoto={renderPhoto}
                onClick={({ index }) => {
                  // 추후 수정
                  router.push(`/contents/${index}`);
                }}
              />
            )}
          </div>

          {/* [신규] 3. 무한 스크롤 로더 */}
          <div className="flex justify-center py-10">
            {isLoadingMore && (
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
            )}
          </div>

          {/* [신규] 4. 모든 콘텐츠 로드 완료 메시지 */}
          {!isLoadingMore && !hasMore && displayedItems.length > 0 && (
            <div className="flex justify-center pb-10">
              <p className="text-gray-500">모든 업로드를 불러왔습니다.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
