"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { throttle } from "lodash";
import RenderContents from "@/components/RenderContents";
import NoDataMessage from "@/components/ui/NoDataMessage";
import { ContentType, FilterType, ITEM_REQUEST_LIMIT, OrderType } from "@/lib/consts";
import { getMediaItemsAPI } from "@/lib/APIs";
import { useLoading } from "@/contexts/LoadingProvider";

export interface MediaItem {
  key: number;
  type: ContentType;
  title: string;

  keyImageSmall: string;
  keyImageMedium: string | null;
  keyImageLarge: string | null;
  keyVideoPreview?: string;
  keyVideoPlayback?: string;
  width: number;
  height: number;
  albumId: number;
}

export default function HomePage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filterType, setFilterType] = useState<FilterType>(FilterType.ALL);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.LATEST);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInit, setIsInit] = useState(true); // 데이터 첫 호출 여부. 최초 호출 후 false.

  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();

  // 스크롤 보존용 ref
  const scrollPositionRef = useRef(0);

  /** 🔥 핵심: 무한 스크롤에서 showLoading 사용 금지 */
  const getFeeds = useCallback(
    async (forcedPage?: number, forcedOrder?: OrderType, forcedFilter?: FilterType) => {
      const loadPage = forcedPage ?? page;
      const loadOrder = forcedOrder ?? orderType;
      const loadFilter = forcedFilter ?? filterType;

      // 최초 로딩 or 필터/정렬 변경 시에만 스피너 표시
      if (isInit) {
        showLoading();
      }

      try {
        const request = {
          page: loadPage,
          sort: loadOrder,
          type: loadFilter,
        };

        const res = await getMediaItemsAPI(request);

        if (res.code === 200) {
          console.log("[getFeeds]items : ", res.data.items);
          const items = res.data.items;
          const photos = items.map((item) => ({
            width: item.width,
            height: item.height,
            key: item.id,
            type: item.type,
            title: item.title,
            albumId: item.albumId,
            isLikedByCurrentUser: item.isLikedByCurrentUser,

            keyImageLarge: item.keyImageLarge,
            keyImageMedium: item.keyImageMedium,
            keyImageSmall: item.keyImageSmall,
            keyVideoPreview: item.type === ContentType.VIDEO && item.keyVideoPreview,
            keyVideoPlayback: item.type === ContentType.VIDEO && item.keyVideoPlayback,
          }));

          // 스크롤 중에는 기존 내용 유지 + append
          setMediaItems((prev) => [...prev, ...photos]);
          setPage(loadPage + 1);

          if (items.length < ITEM_REQUEST_LIMIT) {
            setHasMore(false);
          }
        }
      } catch (error) {
        console.error("[getFeeds]error", error);
        alert(error?.response?.message || "에러가 발생했습니다.");
      } finally {
        if (isInit) {
          hideLoading();
          setIsInit(false);
        }
      }
    },
    [page, orderType, filterType]
  );

  const handleItemOnclick = (photo) => {
    if (photo.albumId) {
      router.push(`/album/${photo.albumId}`);
    } else {
      router.push(`/content/${photo.key}`);
    }
  };

  // 데이터 최초 불러오기, 필터/정렬 변경 시 데이터 새로 불러오기 모두 포함
  useEffect(() => {
    // 기존 데이터 유지 X → 초기화 후 새 로딩
    setMediaItems([]);
    setPage(1);
    setHasMore(true);

    getFeeds(1, orderType, filterType);
  }, [filterType, orderType]);

  // 스크롤 이벤트
  useEffect(() => {
    const handleScrollLogic = () => {
      const bottom =
        window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 400;

      if (bottom && hasMore) {
        scrollPositionRef.current = window.scrollY; // 현재 위치 저장
        console.log("scroll reached to the bottom!!");
        getFeeds();
      }
    };

    const throttledHandleScroll = throttle(handleScrollLogic, 200);

    window.addEventListener("scroll", throttledHandleScroll);
    return () => {
      window.removeEventListener("scroll", throttledHandleScroll);
      throttledHandleScroll.cancel();
    };
  }, [getFeeds, hasMore]);

  return (
    <main className="w-full py-10">
      {mediaItems.length > 0 && (
        <div>
          {/* 필터 버튼 */}
          <div className="flex justify-center space-x-2 sm:space-x-4 mb-8">
            {[
              { key: "ALL", label: "전체" },
              { key: "IMAGE", label: "사진" },
              { key: "VIDEO", label: "영상" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setFilterType(filter.key as FilterType)}
                className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-full font-semibold text-sm sm:text-base transition-colors
              ${
                filterType === filter.key
                  ? "bg-black text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* 정렬 */}
          <div className="ml-4 mb-6">
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as OrderType)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="LATEST">최신순</option>
              <option value="POPULAR">인기순</option>
            </select>
          </div>
        </div>
      )}

      {/* 콘텐츠 */}
      {mediaItems.length > 0 && (
        <RenderContents
          photos={mediaItems}
          onClick={({ photo }: { photo: MediaItem }) => handleItemOnclick(photo)}
        />
      )}

      {/* No Data */}
      <div className="mt-10">
        <NoDataMessage message="콘텐츠가 없습니다" show={!isInit && mediaItems.length === 0} />
      </div>

      {/* 끝 */}
      <NoDataMessage
        message="모든 콘텐츠를 불러왔습니다."
        show={!isInit && !hasMore && mediaItems.length > 0}
      />
    </main>
  );
}
