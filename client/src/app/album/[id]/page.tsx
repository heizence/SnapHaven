"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation"; // useRouter 추가
import Slideshow from "@/components/Slideshow";
import RenderContents from "@/components/RenderContents";
import UserInfoArea from "@/components/ui/UserInfoArea";
import ContentDesc from "@/components/ui/ContentDesc";
import { TagButtons } from "@/components/ui/TagButton";
import { DownloadBtn } from "@/components/ui/DownloadBtn";
import { LikeButton } from "@/components/ui/LikeButton";
import { AddToCollectionBtn } from "@/components/ui/AddToCollectionBtn";
import {
  getAlbumDetailAPI,
  updateAlbumAPI, // 앨범 수정 API 추가
  deleteAlbumAPI, // 앨범 삭제 API 추가
} from "@/lib/APIs";
import { AWS_BASE_URL } from "@/constants";
import { useLoading } from "@/contexts/LoadingProvider";
import { startDownloadAlbum } from "@/lib/downloadFiles";
import CustomLocalStorage from "@/lib/CustomLocalStorage";
import { formatDate } from "@/lib/utils";
import { GetAlbumDetailResDto } from "@/types/api-dtos";

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [isInit, setIsInit] = useState(true);
  const [albumDetail, setAlbumDetail] = useState<GetAlbumDetailResDto>();
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  // --- 수정 관련 상태 ---
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const { showLoading, hideLoading } = useLoading();
  const userInfo = CustomLocalStorage.getUserInfo();

  useEffect(() => {
    if (!id) return;
    getAlbumDetail();
  }, [id]);

  const getAlbumDetail = async () => {
    showLoading();
    const res = await getAlbumDetailAPI({ id });

    if (res.code === 200) {
      const items = res.data.items;
      const photos = items.map((item) => ({
        width: item.width,
        height: item.height,
        key: item.id,
        type: item.type,
        title: res.data.title,
        albumId: res.data.id,

        // 이미지 다운로드를 위한 key
        keyImageLarge: item.keyImageLarge,
        keyImageMedium: item.keyImageMedium,
        keyImageSmall: item.keyImageSmall,
      }));

      setAlbumDetail({ ...res.data, items: photos });
      setEditTitle(res.data.title || "");
      setEditDesc(res.data.description || "");
    }
    setIsInit(false);
    hideLoading();
  };

  // --- 앨범 수정 핸들러 ---
  const handleUpdate = async () => {
    if (!editTitle.trim()) return alert("제목을 입력해주세요.");

    showLoading();
    // 서버 DTO 구조에 맞춰 contentId(id)와 수정 데이터를 전달합니다.
    const res = await updateAlbumAPI({
      contentId: id,
      title: editTitle,
      description: editDesc,
    });

    if (res.code === 202) {
      setIsEditing(false);
      // 로컬 상태 동기화 (하위 아이템 제목도 함께 변경)
      setAlbumDetail((prev) =>
        prev
          ? {
              ...prev,
              title: editTitle,
              description: editDesc,
            }
          : prev
      );
    }
    hideLoading();
    alert("수정되었습니다.");
  };

  // --- 앨범 삭제 핸들러 (트랜잭션 기반) ---
  const handleDelete = async () => {
    if (!confirm("앨범을 영구적으로 삭제하시겠습니까?")) return;

    showLoading();
    const res = await deleteAlbumAPI(id);
    hideLoading();
    if (res.code === 200) {
      alert("앨범이 성공적으로 삭제되었습니다.");
      router.push("/");
    }
  };

  const handleDownloadZip = () => {
    if (!albumDetail) return;
    startDownloadAlbum(albumDetail.id);
  };

  const onOpenSlideshow = (index: number) => {
    setStartIndex(index);
    setShowSlideshow(true);
  };

  if (isInit) return null;
  if (!albumDetail) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 pt-16">
        <h1 className="text-2xl font-bold text-gray-800">404 - 앨범을 찾을 수 없습니다.</h1>
      </main>
    );
  }

  const isOwner = userInfo && userInfo.id === albumDetail.ownerId;
  const slideShowImages = albumDetail.items.map((each) => ({
    src: AWS_BASE_URL + each.keyImageLarge,
  }));

  return (
    <main className="w-full h-full py-5">
      <div className="container mx-auto">
        <div className="flex w-full flex-col overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex w-full flex-col gap-6 p-6 md:p-8">
            <div className="flex items-start justify-between border-b pb-6">
              {/* 제목 수정 영역 */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="flex flex-col gap-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-3xl font-bold border-b-2 border-blue-500 outline-none pb-1"
                      autoFocus
                    />
                  </div>
                ) : (
                  <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                    {albumDetail.title}
                  </h1>
                )}
              </div>

              {/* 액션 버튼 및 본인 인증 버튼 */}
              <div className="flex items-center space-x-2 ml-4">
                {isOwner && !isEditing && (
                  <div className="flex gap-3 mr-4 pr-4 border-r border-gray-200">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition"
                    >
                      앨범 수정
                    </button>
                    <button
                      onClick={handleDelete}
                      className="text-sm font-semibold text-gray-500 hover:text-red-600 transition"
                    >
                      앨범 삭제
                    </button>
                  </div>
                )}

                <DownloadBtn title="ZIP 다운로드" onClick={handleDownloadZip} />
                {userInfo && (
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

            <UserInfoArea
              profileImageKey={albumDetail.ownerProfileImageKey}
              name={albumDetail.ownerNickname}
              uploadedDate={formatDate(albumDetail.createdAt)}
            />

            {/* 설명 수정 영역 */}
            <div className="flex flex-col gap-2">
              {isEditing ? (
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full min-h-[120px] p-4 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="앨범 설명을 입력하세요..."
                />
              ) : (
                <ContentDesc description={albumDetail.description || ""} />
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-full text-sm">
                총 {albumDetail.items.length}개의 콘텐츠
              </p>

              {isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditTitle(albumDetail.title);
                      setEditDesc(albumDetail.description || "");
                    }}
                    className="px-5 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-lg transition"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md"
                  >
                    변경사항 저장
                  </button>
                </div>
              )}
            </div>

            <TagButtons tagsArray={albumDetail.tags} />
          </div>

          <div className="py-2 md:py-6 md:pt-0 px-6 md:px-8">
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
