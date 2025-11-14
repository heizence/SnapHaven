"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import "react-photo-album/masonry.css";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/ModalProvider";
import RenderAlbum from "@/components/RenderAlbum";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import NoDataMessage from "@/components/ui/NoDataMessage";

interface CollectionFolder {
  id: string;
  title: string;
  itemCount: number;
  thumbnail: string;
}

interface CollectionContents {
  id: string;
  title: string;
  photos: any[];
}

const PAGE_LIMIT = 20;

async function getMyCollectionsListAPI(): Promise<CollectionFolder[]> {
  console.log("Fetching Collection Folders List...");
  const mockFolders: CollectionFolder[] = [
    {
      id: "europe",
      title: "유럽 여행",
      itemCount: 124,
      thumbnail:
        "https://images.unsplash.com/photo-1473951574080-01a6571822c9?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: "portraits",
      title: "인물 사진",
      itemCount: 88,
      thumbnail:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: "design-ref",
      title: "디자인 레퍼런스",
      itemCount: 210,
      thumbnail:
        "https://images.unsplash.com/photo-1618220803357-e6b7b7c5b6b1?q=80&w=600&auto=format&fit=crop",
    },
  ];
  await new Promise((res) => setTimeout(res, 300));
  return mockFolders;
}

async function getCollectionContentsAPI(collectionId: string): Promise<CollectionContents> {
  console.log(`Fetching Contents for ${collectionId}...`);

  const generateDummyUploads = (count: number, name: string): any[] => {
    const items: any[] = [];
    const ratios = [
      [600, 400],
      [400, 600],
      [800, 600],
      [500, 500],
      [1280, 720],
    ];
    for (let i = 0; i < count; i++) {
      const [width, height] = ratios[i % ratios.length];
      items.push({
        id: `${collectionId}-item-${i + 1}`,
        src: `https://placehold.co/${width}x${height}/E2E8F0/333?text=${name}+${i + 1}`,
        width: width,
        height: height,
        key: `${collectionId}-item-${i + 1}`,
      });
    }
    return items;
  };

  const titles: { [key: string]: string } = {
    europe: "유럽 여행",
    portraits: "인물 사진",
    "design-ref": "디자인 레퍼런스",
  };
  const counts: { [key: string]: number } = {
    europe: 124,
    portraits: 88,
    "design-ref": 210,
  };

  const mockContents: CollectionContents = {
    id: collectionId,
    title: titles[collectionId] || "알 수 없는 컬렉션",
    photos: generateDummyUploads(counts[collectionId] || 10, titles[collectionId]),
  };

  await new Promise((res) => setTimeout(res, 500)); // 콘텐츠 로드 시 딜레이
  return mockContents;
}

export default function MyCollectionsPage() {
  const [isLoadingPage, setIsLoadingPage] = useState(true); // 전체 페이지 초기 로딩
  const [collectionFolders, setCollectionFolders] = useState<CollectionFolder[]>([]); // 상단 폴더 목록
  const [selectedCollection, setSelectedCollection] = useState<CollectionFolder | null>(null); // 선택된 폴더

  // 하단 그리드 (콘텐츠)용 State
  const [allContents, setAllContents] = useState<any[]>([]); // 선택된 컬렉션의 *모든* 사진 (DB)
  const [displayedItems, setDisplayedItems] = useState<any[]>([]); // 화면에 표시될 사진 (페이징)
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingContents, setIsLoadingContents] = useState(false); // 하단 그리드 로딩
  const [isLoadingMore, setIsLoadingMore] = useState(false); // 무한 스크롤 로딩

  const router = useRouter();
  const { openAlertModal, openCustomModal } = useModal(); // [신규] 3. 훅 사용

  // --- Functions ---

  // [신규] 6. 특정 컬렉션의 콘텐츠를 로드하는 함수
  const loadCollectionContents = async (collection: CollectionFolder) => {
    if (selectedCollection?.id === collection.id) return; // 이미 선택된 탭이면 무시

    setIsLoadingContents(true); // 하단 그리드 로딩 시작
    setSelectedCollection(collection);
    setDisplayedItems([]); // 기존 그리드 비우기

    const data = await getCollectionContentsAPI(collection.id);

    setAllContents(data.photos); // 전체 사진 (DB) 저장

    // 첫 페이지 로드
    const firstPageItems = data.photos.slice(0, PAGE_LIMIT);
    setDisplayedItems(firstPageItems);
    setPage(2);
    setHasMore(firstPageItems.length < data.photos.length);
    setIsLoadingContents(false);
  };

  //   useEffect(() => {
  //     openAlertModal({
  //       type: "success",
  //       title: "업로드 성공",
  //       message: "메시지를 입력하세요.",
  //     });
  //   }, []);

  // 7. 초기 데이터 로드 (페이지 + 첫 번째 폴더 콘텐츠)
  useEffect(() => {
    async function loadData() {
      setIsLoadingPage(true);

      // 1. 폴더 목록 가져오기
      const folders = await getMyCollectionsListAPI();
      setCollectionFolders(folders);

      // 2. 첫 번째 폴더를 기본으로 선택하고, 콘텐츠 로드
      if (folders.length > 0) {
        const firstFolder = folders[0];
        setSelectedCollection(firstFolder); // 기본 선택

        const data = await getCollectionContentsAPI(firstFolder.id);
        setAllContents(data.photos);

        const firstPageItems = data.photos.slice(0, PAGE_LIMIT);
        setDisplayedItems(firstPageItems);
        setPage(2);
        setHasMore(firstPageItems.length < data.photos.length);
      }

      setIsLoadingPage(false);
    }
    loadData();
  }, []);

  // 8. 무한 스크롤 핸들러 (기존과 동일)
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore || isLoadingContents || !allContents) return;
    setIsLoadingMore(true);

    const start = (page - 1) * PAGE_LIMIT;
    const end = page * PAGE_LIMIT;
    const newItems = allContents.slice(start, end);

    setTimeout(() => {
      setDisplayedItems((prev) => [...prev, ...newItems]);
      setPage((prev) => prev + 1);
      setHasMore(end < allContents.length);
      setIsLoadingMore(false);
    }, 500);
  }, [isLoadingMore, hasMore, page, allContents, isLoadingContents]);

  // 9. 스크롤 이벤트 핸들러 (기존과 동일)
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 2 >=
        document.documentElement.offsetHeight
      ) {
        handleLoadMore();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleLoadMore]);

  // --- 11. 렌더링 ---
  if (isLoadingPage) {
    return <LoadingSpinner isLoading={isLoadingPage} />;
  }

  return (
    <main className="w-full min-h-[calc(100vh-56px)] bg-white px-5">
      <div className="container mx-auto py-5">
        <div className="flex w-full flex-col rounded-xl bg-white">
          {/* --- 1. 상단: 컬렉션 정보 --- */}
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900">내 컬렉션</h1>
              <Button className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
                <Plus size={16} />
                <span>새 컬렉션 생성</span>
              </Button>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">목록</h2>

            {/* 컬렉션 목록 그리드 */}
            <div className="max-h-96 overflow-y-auto custom-scrollbar p-2">
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {collectionFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => loadCollectionContents(folder)}
                    // [유지] 링 스타일
                    className={`relative aspect-square w-full rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md group
                      ${
                        selectedCollection?.id === folder.id
                          ? "ring-2 ring-blue-600 ring-offset-2"
                          : "hover:border-gray-300"
                      }
                    `}
                  >
                    {/* 썸네일 이미지 */}
                    <Image
                      src={folder.thumbnail}
                      alt={folder.title}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw" // sizes 수정
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* 그라데이션 오버레이 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    {/* 하단 텍스트 */}
                    <div className="absolute bottom-3 left-3 text-left text-white">
                      <p className="font-semibold">{folder.title}</p>
                      <p className="text-sm">{folder.itemCount}개 아이템</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* --- 2. 하단: 컬렉션 콘텐츠 --- */}
          {selectedCollection && (
            <div className="p-6 md:p-8 border-t border-gray-200">
              {/* 하단 그리드 제목 */}
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{selectedCollection.title}</h2>

              {/* 하단 그리드 (Masonry) */}
              {isLoadingContents ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <RenderAlbum
                  photos={displayedItems}
                  onClick={({ index }) => router.push(`/contents/${index}`)}
                />
              )}

              {/* 무한 스크롤 로더 */}
              <LoadingSpinner isLoading={isLoadingMore} />

              <NoDataMessage
                message="모든 콘텐츠를 불러왔습니다."
                show={!isLoadingMore && !hasMore && displayedItems.length > 0}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
