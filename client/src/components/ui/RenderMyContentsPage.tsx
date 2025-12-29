"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import RenderContents from "@/components/RenderContents";
import NoDataMessage from "@/components/ui/NoDataMessage";
import { useLoading } from "@/contexts/LoadingProvider";
import { getMyLikedContentsAPI, getMyUploadsAPI } from "@/lib/APIs";
import { ITEM_REQUEST_LIMIT } from "@/constants";
import { throttle } from "lodash";
import { GetMediaItemsReqDto } from "@/types/api-dtos";
import { ContentType } from "@/constants/enums";
import { Photo } from "@/types/data";

type RenderType = "UPLOADS" | "LIKES";

export default function RenderMyContentsPage({ type }: { type: RenderType }) {
  const [isInit, setIsInit] = useState(true); // 데이터 첫 호출 여부. 최초 호출 후 false.
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isFetching = useRef(false);
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();

  // 스크롤 보존용 ref
  const scrollPositionRef = useRef(0);

  const getData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    if (isInit) {
      showLoading();
    }

    const request: GetMediaItemsReqDto = {
      page: page,
    };

    const apiToCall = type === "UPLOADS" ? getMyUploadsAPI : getMyLikedContentsAPI;

    const res = await apiToCall(request);

    if (res.code === 200) {
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
        keyVideoPreview: item.type === ContentType.VIDEO ? item.keyVideoPreview : null,
        keyVideoPlayback: item.type === ContentType.VIDEO ? item.keyVideoPlayback : null,
      }));

      setPhotos((prev) => [...prev, ...photos]);
      setPage((prev) => prev + 1);

      if (items.length < ITEM_REQUEST_LIMIT) {
        setHasMore(false);
      }
    }

    if (isInit) {
      setIsInit(false);
    }

    hideLoading();
    isFetching.current = false;
  }, [page]);

  const handleItemOnclick = (photo: Photo) => {
    if (photo.albumId) {
      router.push(`/album/${photo.albumId}`);
    } else {
      router.push(`/content/${photo.key}`);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  // 스크롤 이벤트
  useEffect(() => {
    const handleScrollLogic = () => {
      const bottom =
        window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 400;

      if (bottom && hasMore) {
        scrollPositionRef.current = window.scrollY; // 현재 위치 저장
        getData();
      }
    };

    const throttledHandleScroll = throttle(handleScrollLogic, 200);

    window.addEventListener("scroll", throttledHandleScroll);
    return () => {
      window.removeEventListener("scroll", throttledHandleScroll);
      throttledHandleScroll.cancel();
    };
  }, [getData, hasMore]);

  // 내 업로드 페이지 헤더
  const UploadsHeader = () => {
    if (type !== "UPLOADS") return null;
    return (
      <div className="p-6 md:p-8 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">내 업로드</h1>
        <p className="text-gray-600 mt-2">내가 올린 모든 사진과 영상을 관리하세요.</p>
      </div>
    );
  };

  // 좋아요 페이지 헤더
  const LikesHeader = () => {
    if (type !== "LIKES") return null;
    return (
      <div className="p-6 md:p-8 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">내 좋아요</h1>
      </div>
    );
  };

  return (
    <main className="w-full h-full py-5">
      <div className="container mx-auto">
        <div className="flex w-full flex-col">
          {/* 헤더 영역 */}
          {UploadsHeader()}
          {LikesHeader()}

          {photos.length > 0 && (
            <div className="py-6 md:py-8">
              <RenderContents
                photos={photos}
                onClick={({ photo }: { photo: Photo }) => handleItemOnclick(photo)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <NoDataMessage message="콘텐츠가 없습니다" show={!isInit && photos.length === 0} />
      </div>

      <NoDataMessage
        message="모든 콘텐츠를 불러왔습니다."
        show={!isInit && !hasMore && photos.length > 0}
      />
    </main>
  );
}
