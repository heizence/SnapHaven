"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { throttle } from "lodash";
import RenderContents from "@/components/RenderContents";
import NoDataMessage from "@/components/ui/NoDataMessage";
import { ITEM_REQUEST_LIMIT } from "@/constants";
import { getMediaItemsAPI } from "@/lib/APIs";
import { useLoading } from "@/contexts/LoadingProvider";
import { ContentType, FilterType, OrderType } from "@/constants/enums";
import { Photo } from "@/types/data";
import { TagButton } from "./ui/TagButton";

type RenderType = "MAIN" | "KEYWORD_SEARCH" | "TAG_SEARCH";

/**
 * 메인 페이지, 검색 페이지, 태그 검색 페이지를 랜더링하는 공용 컴포넌트
 * type 으로 페이지 종류를 식별하여 종류별 헤더 및 기능을 적용
 */
export default function RenderMainPage({ type }: { type: RenderType }) {
  const [isInit, setIsInit] = useState(true); // 데이터 첫 호출 여부. 최초 호출 후 false.
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filterType, setFilterType] = useState<FilterType>(FilterType.ALL);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.LATEST);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState(true);

  const isFetching = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const keyword = type === "KEYWORD_SEARCH" ? searchParams?.get("keyword") : undefined;
  const tagName = type === "TAG_SEARCH" ? searchParams?.get("name") : undefined;

  const { showLoading, hideLoading } = useLoading();

  // 스크롤 보존용 ref
  const scrollPositionRef = useRef(0);

  const getFeeds = useCallback(
    async (forcedPage?: number, forcedOrder?: OrderType, forcedFilter?: FilterType) => {
      if (isFetching.current) return;
      isFetching.current = true;

      const loadPage = forcedPage ?? page;
      const loadOrder = forcedOrder ?? orderType;
      const loadFilter = forcedFilter ?? filterType;

      // 최초 로딩 or 필터/정렬 변경 시에만 스피너 표시
      if (isInit) {
        showLoading();
      }

      const request = {
        page: loadPage,
        sort: loadOrder,
        type: loadFilter,
        keyword: keyword || "",
        tag: tagName || "",
      };

      const res = await getMediaItemsAPI(request);

      if (res.code === 200) {
        const items = res.data.items;
        const photos: Photo[] = items.map((item) => ({
          key: item.id,
          type: item.type,
          title: item.title,
          albumId: item.albumId,
          isLikedByCurrentUser: item.isLikedByCurrentUser,

          width: item.width,
          height: item.height,

          keyImageLarge: item.keyImageLarge,
          keyImageMedium: item.keyImageMedium,
          keyImageSmall: item.keyImageSmall,
          keyVideoPreview: item.type === ContentType.VIDEO ? item.keyVideoPreview : null,
          keyVideoPlayback: item.type === ContentType.VIDEO ? item.keyVideoPlayback : null,
        }));

        // 스크롤 중에는 기존 내용 유지 + append
        setPhotos((prev) => [...prev, ...photos]);
        setTotalCount(res.data?.totalCounts || 0);
        setPage(loadPage + 1);

        if (items.length < ITEM_REQUEST_LIMIT) {
          setHasMore(false);
        }
      }

      if (isInit) {
        setIsInit(false);
      }

      hideLoading();
      isFetching.current = false;
    },
    [page, orderType, filterType, keyword, tagName]
  );

  const handleItemOnclick = (photo: Photo) => {
    if (photo.albumId) {
      router.push(`/album/${photo.albumId}`);
    } else {
      router.push(`/content/${photo.key}`);
    }
  };

  // 데이터 최초 불러오기, 필터/정렬 변경 시 데이터 새로 불러오기 모두 포함
  useEffect(() => {
    // 기존 데이터 유지 X → 초기화 후 새 로딩
    setPhotos([]);
    setPage(1);
    setHasMore(true);

    getFeeds(1, orderType, filterType);
  }, [filterType, orderType, keyword, tagName]);

  // 스크롤 이벤트
  useEffect(() => {
    const handleScrollLogic = () => {
      const bottom =
        window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 400;

      if (bottom && hasMore) {
        scrollPositionRef.current = window.scrollY; // 현재 위치 저장
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

  // 메인 페이지 헤더 랜더링
  const MainHeader = () => {
    if (type !== "MAIN") return null;
    return (
      <>
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
      </>
    );
  };

  // 키워드 검색 페이지 헤더 랜더링
  const KeywordSearchHeader = () => {
    if (type !== "KEYWORD_SEARCH") return null;
    return (
      <div className="mx-5">
        <h1 className="mb-3 text-2xl font-bold">키워드 : {keyword}</h1>

        <h1 className="mb-6 text-xl">총 {totalCount}개의 검색 결과가 있습니다.</h1>
        <div className="flex justify-start space-x-2 sm:space-x-4 mb-8">
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
      </div>
    );
  };

  // 태그 검색 페이지 헤더 랜더링
  const TagSearchHeader = () => {
    if (type !== "TAG_SEARCH" && !tagName) return null;
    return (
      <div className="mx-5">
        <h1 className="mb-3 text-2xl font-bold">태그</h1>
        <TagButton name={tagName!} />
        <h1 className="mt-6 mb-6 text-xl">총 {totalCount}개의 검색 결과가 있습니다.</h1>
        <div className="flex justify-start space-x-2 sm:space-x-4 mb-8">
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
      </div>
    );
  };

  return (
    <main className="w-full py-10">
      {MainHeader()}
      {KeywordSearchHeader()}
      {TagSearchHeader()}

      {/* 콘텐츠 */}
      {photos.length > 0 && (
        <RenderContents
          photos={photos}
          onClick={({ photo }: { photo: Photo }) => handleItemOnclick(photo)}
        />
      )}

      {/* No Data */}
      <div className="mt-10">
        <NoDataMessage message="콘텐츠가 없습니다" show={!isInit && photos.length === 0} />
      </div>

      {/* 끝 */}
      <NoDataMessage
        message="모든 콘텐츠를 불러왔습니다."
        show={!isInit && !hasMore && photos.length > 0}
      />
    </main>
  );
}
