"use client";

import RenderMainPage from "@/components/RenderMainPage";

// import { useState, useEffect, useCallback, useRef } from "react";
// import "react-photo-album/masonry.css";
// import { useRouter, useSearchParams } from "next/navigation";
// import RenderContents from "@/components/RenderContents";
// import NoDataMessage from "@/components/ui/NoDataMessage";
// import { TagButton } from "@/components/ui/TagButton";
// import { ITEM_REQUEST_LIMIT } from "@/lib/consts";
// import { useLoading } from "@/contexts/LoadingProvider";
// import { getMediaItemsAPI } from "@/lib/APIs";
// import { throttle } from "lodash";
// import { MediaItem } from "../page";
// import { GetMediaItemsRequest } from "@/lib/interfaces";
// import { ContentType, FilterType, OrderType } from "@/constants/enums";
// import RenderMainPage from "@/components/RenderMainPage";

// export default function HomePage() {
//   const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
//   const [totalCount, setTotalCount] = useState<number>(0);
//   const [filterType, setFilterType] = useState<FilterType>(FilterType.ALL);

//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [isInit, setIsInit] = useState(true); // 데이터 첫 호출 여부. 최초 호출 후 false.

//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const tagName = searchParams?.get("name");
//   const { showLoading, hideLoading } = useLoading();
//   console.log("tagName : ", tagName);
//   // 스크롤 보존용 ref
//   const scrollPositionRef = useRef(0);

//   const getFeeds = useCallback(
//     async (forcedPage?: number, forcedFilter?: FilterType) => {
//       const loadPage = forcedPage ?? page;
//       const loadFilter = forcedFilter ?? filterType;

//       // 최초 로딩 or 필터/정렬 변경 시에만 스피너 표시
//       if (isInit) {
//         showLoading();
//       }

//       const request: GetMediaItemsRequest = {
//         page: loadPage,
//         type: loadFilter,
//         tag: tagName || "",
//       };

//       const res = await getMediaItemsAPI(request);

//       if (res.code === 200) {
//         console.log("[getFeeds]items : ", res.data);
//         const items = res.data.items;
//         const photos = items.map((item) => ({
//           width: item.width,
//           height: item.height,
//           key: item.id,
//           type: item.type,
//           title: item.title,
//           albumId: item.albumId,
//           isLikedByCurrentUser: item.isLikedByCurrentUser,

//           keyImageLarge: item.keyImageLarge,
//           keyImageMedium: item.keyImageMedium,
//           keyImageSmall: item.keyImageSmall,
//           keyVideoPreview: item.type === ContentType.VIDEO && item.keyVideoPreview,
//         }));

//         // 스크롤 중에는 기존 내용 유지 + append
//         setMediaItems((prev) => [...prev, ...photos]);
//         setTotalCount(res.data?.totalCounts || 0);
//         setPage(loadPage + 1);

//         if (items.length < ITEM_REQUEST_LIMIT) {
//           setHasMore(false);
//         }

//         if (isInit) {
//           setIsInit(false);
//         }
//       }
//       hideLoading();
//     },
//     [page, filterType]
//   );

//   const handleItemOnclick = (photo) => {
//     if (photo.albumId) {
//       router.push(`/album/${photo.albumId}`);
//     } else {
//       router.push(`/content/${photo.key}`);
//     }
//   };

//   // 데이터 최초 불러오기, 필터/정렬 변경 시 데이터 새로 불러오기 모두 포함
//   useEffect(() => {
//     // 기존 데이터 유지 X → 초기화 후 새 로딩
//     setMediaItems([]);
//     setPage(1);
//     setHasMore(true);

//     getFeeds(1, filterType);
//   }, [filterType]);

//   // 스크롤 이벤트
//   useEffect(() => {
//     const handleScrollLogic = () => {
//       const bottom =
//         window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 400;

//       if (bottom && hasMore) {
//         scrollPositionRef.current = window.scrollY; // 현재 위치 저장
//         console.log("scroll reached to the bottom!!");
//         getFeeds();
//       }
//     };

//     const throttledHandleScroll = throttle(handleScrollLogic, 200);

//     window.addEventListener("scroll", throttledHandleScroll);
//     return () => {
//       window.removeEventListener("scroll", throttledHandleScroll);
//       throttledHandleScroll.cancel();
//     };
//   }, [getFeeds, hasMore]);

//   return (
//     <main className="w-full py-10">
//       {/* 필터 버튼 UI (기존과 동일) */}

//       <div className="mx-5">
//         <h1 className="mb-3 text-2xl font-bold">태그</h1>
//         <TagButton name={tagName} />
//         <h1 className="mt-6 mb-6 text-xl">총 {totalCount}개의 검색 결과가 있습니다.</h1>
//         <div className="flex justify-start space-x-2 sm:space-x-4 mb-8">
//           {[
//             { key: "ALL", label: "전체" },
//             { key: "IMAGE", label: "사진" },
//             { key: "VIDEO", label: "영상" },
//           ].map((filter) => (
//             <button
//               key={filter.key}
//               onClick={() => setFilterType(filter.key as FilterType)}
//               className={`px-4 py-2 sm:px-6 sm:py-2.5 rounded-full font-semibold text-sm sm:text-base transition-colors duration-200 ease-in-out
//               ${
//                 filterType === filter.key
//                   ? "bg-black text-white shadow-md"
//                   : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
//               }`}
//             >
//               {filter.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {mediaItems.length > 0 && (
//         <RenderContents
//           photos={mediaItems}
//           onClick={({ photo }: { photo: MediaItem }) => handleItemOnclick(photo)}
//         />
//       )}

//       {/* No Data */}
//       <div className="mt-10">
//         <NoDataMessage message="콘텐츠가 없습니다" show={!isInit && mediaItems.length === 0} />
//       </div>

//       {/* 끝 */}
//       <NoDataMessage
//         message="모든 콘텐츠를 불러왔습니다."
//         show={!isInit && !hasMore && mediaItems.length > 0}
//       />
//     </main>
//   );
// }

export default function Page() {
  return <RenderMainPage type={"TAG_SEARCH"} />;
}
