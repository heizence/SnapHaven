"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Slideshow from "@/components/Slideshow";

import RenderContents from "@/components/RenderContents";
import UserInfoArea from "@/components/ui/UserInfoArea";
import ContentDesc from "@/components/ui/ContentDesc";
import { TagButtons } from "@/components/ui/TagButton";
import { DownloadBtn } from "@/components/ui/DownloadBtn";
import { LikeButton } from "@/components/ui/LikeButton";
import { AddToCollectionBtn } from "@/components/ui/AddToCollectionBtn";
import { GetSingleItemRequest } from "@/lib/interfaces";
import { useLoading } from "@/contexts/LoadingProvider";
import { getAlbumDetailAPI } from "@/lib/APIs";
import { AWS_BASE_URL, ContentType } from "@/lib/consts";
import { handleAlbumZipDownload } from "@/lib/downloadFiles";
import CustomLocalStorage from "@/lib/CustomLocalStorage";

interface AlbumMediaItem {
  id: number;
  type: ContentType;
  width: number;
  height: number;
  src: string;
  keyImageSmall: string;
  keyImageMedium: string | null;
  keyImageLarge: string | null;
}

interface AlbumDetail {
  id: number;
  title: string;
  description: string;
  ownerNickname: string;
  ownerProfileImageKey: string | null;
  createdAt: string;
  tags: string[];
  isLikedByCurrentUser: boolean;
  representativeItemId: number; // 앨범 대표(커버) 아이템 id. 컬렉션에 추가/제거 요청 시 사용하기
  items: AlbumMediaItem[];
}

export default function CollectionDetailPage() {
  const params = useParams();
  const id = params.id as number;

  const [isInit, setIsInit] = useState(true); // 첫 랜더링 여부. 데이터 불러오고 나면 false.
  const [albumDetail, setAlbumDetail] = useState<AlbumDetail>();
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [startIndex, setStartIndex] = useState(0); // 클릭한 이미지 인덱스

  const { showLoading, hideLoading } = useLoading();

  const isSignedIn = CustomLocalStorage.getUserInfo();

  useEffect(() => {
    if (!id) return;
    getAlbumDetail();
  }, [id]);

  const getAlbumDetail = async () => {
    const request: GetSingleItemRequest = {
      id,
    };
    try {
      showLoading();
      const res = await getAlbumDetailAPI(request);

      if (res.code === 200) {
        console.log("[getAlbumDetail]res : ", res.data);
        const items = res.data.items;

        const photos = items.map((item) => ({
          //src: AWS_BASE_URL + item.keyImageSmall,
          width: item.width,
          height: item.height,
          key: item.id,
          type: item.type,
          title: item.title,
          albumId: item.albumId,

          // 이미지 다운로드를 위한 key
          keyImageLarge: item.keyImageLarge,
          keyImageMedium: item.keyImageMedium,
          keyImageSmall: item.keyImageSmall,
        }));

        setAlbumDetail({
          ...res.data,
          items: photos,
        });
      }
    } catch (error) {
      console.error("[getFeeds]error", error);
      alert(error?.response?.message || "에러가 발생했습니다.");
    } finally {
      setIsInit(false);
      hideLoading();
    }
  };

  const handleDownloadZip = () => {
    const { id } = albumDetail!;
    handleAlbumZipDownload(id);
  };

  // 슬라이드쇼 열기 핸들러
  const onOpenSlideshow = (index: number) => {
    setStartIndex(index);
    setShowSlideshow(true);
  };

  // 로딩 및 404
  if (isInit) return null;

  if (!albumDetail) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 pt-16">
        <h1 className="text-2xl font-bold text-gray-800">404 - 앨범을 찾을 수 없습니다.</h1>
      </main>
    );
  }

  const slideShowImages = albumDetail?.items.map((each) => {
    return {
      src: AWS_BASE_URL + each.keyImageLarge,
    };
  });

  return (
    <main className="w-full h-full py-5">
      <div className="container mx-auto">
        {/* 앨범은 단일 카드 안에 정보와 그리드를 모두 포함 */}
        <div className="flex w-full flex-col overflow-hidden rounded-xl">
          <div className="flex w-full flex-col gap-6 p-6 md:p-8">
            <div className="flex items-start justify-between">
              {/* 제목 */}
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {albumDetail.title}
              </h1>

              {/* 액션 버튼 */}
              <div className="flex items-center space-x-2">
                <DownloadBtn title="앨범 전체 ZIP 다운로드" onClick={handleDownloadZip} />

                {isSignedIn && (
                  <>
                    <LikeButton
                      isLiked={albumDetail.isLikedByCurrentUser}
                      mediaItemId={albumDetail.representativeItemId}
                    />
                    <AddToCollectionBtn mediaId={albumDetail.representativeItemId} />
                  </>
                )}
              </div>
            </div>
            {/* 유저 정보 */}
            <UserInfoArea
              avatarUrl={AWS_BASE_URL + albumDetail.ownerProfileImageKey}
              name={albumDetail.ownerNickname}
              uploadedDate="2025.11.14"
            />
            {/* 설명 */}
            <ContentDesc description={albumDetail.description || ""} />
            {/* 총 갯수 */}
            <p className="font-semibold text-gray-700">총 {albumDetail.items.length}장</p>
            {/* 태그 */}
            <TagButtons tagsArray={albumDetail.tags} />
          </div>

          <div className="py-2 md:py-6 md:pt-0">
            <RenderContents
              isAlbumPage={true}
              photos={albumDetail.items}
              onClick={({ index }) => onOpenSlideshow(index)}
            />
          </div>
        </div>
      </div>

      {showSlideshow && (
        <Slideshow
          images={slideShowImages}
          startIndex={startIndex}
          onClose={() => setShowSlideshow(false)}
        />
      )}
    </main>
  );
}
