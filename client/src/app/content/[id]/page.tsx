"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Slideshow from "@/components/Slideshow";
import UserInfoArea from "@/components/ui/UserInfoArea";
import ContentDesc from "@/components/ui/ContentDesc";
import { TagButtons } from "@/components/ui/TagButton";
import { DownloadBtn } from "@/components/ui/DownloadBtn";
import { LikeButton } from "@/components/ui/LikeButton";
import { AddToCollectionBtn } from "@/components/ui/AddToCollectionBtn";
import { getSingleMediaItemAPI } from "@/lib/APIs";
import { GetSingleMediaItemRequest } from "@/lib/interfaces";
import { AWS_BASE_URL, ContentType } from "@/lib/consts";
import { useLoading } from "@/contexts/LoadingProvider";
import { formatDate } from "@/lib/utils";

interface MediaDetail {
  id: string;
  type: ContentType;
  keyImageLarge: string;
  keyImageMedium: string;
  keyImageSmall: string;
  keyVideoPlayback: string | null;
  width: number;
  height: number;
  title: string;
  description: string;
  tags: string[];
  downloadCount: number;
  likeCount: number;
  ownerNickname: string;
  ownerProfileImageKey: string;
  createdAt: string;
}

export default function ContentDetailPage() {
  const params = useParams();
  const id = params.id as number;

  const [isInit, setIsInit] = useState(true); // 첫 랜더링 여부. 데이터 불러오고 나면 false.
  const [mediaDetail, setMediaDetail] = useState<MediaDetail | null>(null);
  const [showSlideshow, setShowSlideshow] = useState(false);

  const { showLoading, hideLoading } = useLoading();

  // [수정] 데이터 페칭 (URL의 ID를 사용)
  useEffect(() => {
    getSingleMediaItem();
  }, [id]);

  const getSingleMediaItem = async () => {
    const request: GetSingleMediaItemRequest = {
      id,
    };
    try {
      showLoading();
      const res = await getSingleMediaItemAPI(request);

      if (res.code === 200) {
        console.log("[getSingleMediaItem]res : ", res.data);
        const item = res.data;
        setMediaDetail(item);
      }
    } catch (error) {
      console.error("[getFeeds]error", error);
      alert(error?.response?.message || "에러가 발생했습니다.");
    } finally {
      setIsInit(false);
      hideLoading();
    }
  };

  // 슬라이드쇼 열기 핸들러
  const onOpenSlideshow = () => {
    if (mediaDetail!.type === "IMAGE") {
      setShowSlideshow(true);
    }
  };

  // 로딩 및 404
  if (isInit) return null;

  if (!mediaDetail) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 pt-16">
        <h1 className="text-2xl font-bold text-gray-800">404 - 콘텐츠를 찾을 수 없습니다.</h1>
        <p className="text-gray-600 mt-2">
          `content/[id]` 경로에서 ID를 확인하세요. (예: /content/image-landscape)
        </p>
      </main>
    );
  }

  const mediaClassName = "w-full h-auto object-contain max-h-[80vh] min-h-[30vh]";

  return (
    <main className="w-full h-full py-5">
      <div className="container mx-auto">
        <div className="flex w-full flex-col overflow-hidden rounded-xl bg-white">
          {/* 이미지/비디오 렌더링 영역 */}
          <div className="flex w-full max-h-screen items-center justify-center">
            {mediaDetail.type === "IMAGE" && mediaDetail.keyImageLarge && (
              <div onClick={onOpenSlideshow} className="cursor-pointer">
                <Image
                  src={AWS_BASE_URL + mediaDetail.keyImageLarge}
                  alt={mediaDetail.title || ""}
                  width={mediaDetail.width}
                  height={mediaDetail.height}
                  className={mediaClassName}
                  priority
                />
              </div>
            )}

            {mediaDetail.type === "VIDEO" && mediaDetail.keyVideoPlayback && (
              <video
                // 비디오 비율에 맞게 스타일 적용 (object-contain)
                className={mediaClassName}
                src={AWS_BASE_URL + mediaDetail.keyVideoPlayback}
                controls
                playsInline
                preload="metadata"
                // 세로 비디오가 9:16일 때 가로를 채우지 않도록 처리
                style={{
                  width: mediaDetail.width > mediaDetail.height ? "100%" : "auto",
                  height: mediaDetail.width > mediaDetail.height ? "auto" : "100%",
                }}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>

          {/* 정보 영역 */}
          <div className="flex w-full flex-col gap-6 p-6 md:p-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                  {mediaDetail.title}
                </h1>

                {/* 다운로드, 좋아요, 컬렉션에 추가 버튼 */}
                <div className="flex-shrink-0 flex space-x-2 ml-4">
                  <DownloadBtn onClick={() => {}} />
                  <LikeButton isLiked={true} />
                  <AddToCollectionBtn isCollected={false} />
                </div>
              </div>
            </div>

            {/* 유저 정보 */}
            <UserInfoArea
              avatarUrl={AWS_BASE_URL + mediaDetail.ownerProfileImageKey}
              name={mediaDetail.ownerNickname}
              uploadedDate={formatDate(mediaDetail.createdAt)}
            />
            {/* 설명 */}
            <ContentDesc description={mediaDetail.description || ""} />
            {/* 태그 */}
            <TagButtons tagsArray={mediaDetail.tags} />
          </div>
        </div>
      </div>

      {showSlideshow && mediaDetail.type === "IMAGE" && mediaDetail.keyImageLarge && (
        <Slideshow
          images={[{ src: AWS_BASE_URL + mediaDetail.keyImageLarge, name: mediaDetail.title }]}
          startIndex={0}
          onClose={() => setShowSlideshow(false)}
        />
      )}
    </main>
  );
}
