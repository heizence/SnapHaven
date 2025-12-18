"use client";

import RenderMyContentsPage from "@/components/ui/RenderMyContentsPage";

// import { useState, useEffect, useRef } from "react";
// import { useRouter } from "next/navigation";
// import "react-photo-album/masonry.css";
// import { throttle } from "lodash";
// import RenderContents from "@/components/RenderContents";
// import NoDataMessage from "@/components/ui/NoDataMessage";
// import { useLoading } from "@/contexts/LoadingProvider";
// import { getMyLikedContentsAPI } from "@/lib/APIs";
// import { ITEM_REQUEST_LIMIT } from "@/lib/consts";
// import { ContentType } from "@/constants/enums";
// import { GetMediaItemsReqDto } from "@/types/api-dtos";

// interface MediaItemDto {
//   id: number;
//   type: "IMAGE" | "VIDEO";
//   title: string;
//   urls: {
//     small: string;
//     medium: string;
//     large: string;
//   };
//   width: number;
//   height: number;
// }

// export default function MyLikedContentsPage() {
//   const [isInit, setIsInit] = useState(true);
//   const [contents, setContents] = useState<MediaItemDto[]>([]);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);

//   const router = useRouter();
//   const { showLoading, hideLoading } = useLoading();

//   // 스크롤 보존용 ref
//   const scrollPositionRef = useRef(0);

//   const getContents = async () => {
//     if (isInit) {
//       showLoading();
//     }

//     const request: GetMediaItemsReqDto = {
//       page: page,
//     };
//     const res = await getMyLikedContentsAPI(request);

//     if (res.code === 200) {
//       const items = res.data.items;
//       const photos = items.map((item) => ({
//         width: item.width,
//         height: item.height,
//         key: item.id,
//         type: item.type,
//         title: item.title,
//         albumId: item.albumId,
//         isLikedByCurrentUser: item.isLikedByCurrentUser,

//         keyImageLarge: item.keyImageLarge,
//         keyImageMedium: item.keyImageMedium,
//         keyImageSmall: item.keyImageSmall,
//         keyVideoPreview: item.type === ContentType.VIDEO && item.keyVideoPreview,
//       }));

//       setContents((prev) => [...prev, ...photos]);
//       setPage((prev) => prev + 1);

//       if (items.length < ITEM_REQUEST_LIMIT) {
//         setHasMore(false);
//       }
//     }

//     hideLoading();
//     setIsInit(false);
//   };

//   const handleItemOnclick = (photo) => {
//     if (photo.albumId) {
//       router.push(`/album/${photo.albumId}`);
//     } else {
//       router.push(`/content/${photo.key}`);
//     }
//   };

//   useEffect(() => {
//     getContents();
//   }, []);

//   // 스크롤 이벤트
//   useEffect(() => {
//     const handleScrollLogic = () => {
//       const bottom =
//         window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 400;

//       if (bottom && hasMore) {
//         scrollPositionRef.current = window.scrollY; // 현재 위치 저장
//         //console.log("scroll reached to the bottom!!");
//         getContents();
//       }
//     };

//     const throttledHandleScroll = throttle(handleScrollLogic, 200);

//     window.addEventListener("scroll", throttledHandleScroll);
//     return () => {
//       window.removeEventListener("scroll", throttledHandleScroll);
//       throttledHandleScroll.cancel();
//     };
//   }, [hasMore]);

//   return (
//     <main className="w-full h-full py-5">
//       <div className="container mx-auto">
//         <div className="flex w-full flex-col">
//           {/* 헤더 영역 */}
//           <div className="p-6 md:p-8 border-b border-gray-200">
//             <h1 className="text-3xl font-bold text-gray-900">내 좋아요</h1>
//           </div>

//           <div className="py-6 md:py-8">
//             <RenderContents photos={contents} onClick={({ photo }) => handleItemOnclick(photo)} />
//           </div>
//         </div>
//       </div>

//       <div className="mt-10">
//         <NoDataMessage message="콘텐츠가 없습니다" show={!isInit && contents.length === 0} />
//       </div>

//       <NoDataMessage
//         message="모든 콘텐츠를 불러왔습니다."
//         show={!isInit && !hasMore && contents.length > 0}
//       />
//     </main>
//   );
// }

export default function Page() {
  return <RenderMyContentsPage type={"LIKES"} />;
}
