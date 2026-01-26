"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation"; // useRouter 추가
import Image from "next/image";
import Slideshow from "@/components/Slideshow";
import UserInfoArea from "@/components/ui/UserInfoArea";
import ContentDesc from "@/components/ui/ContentDesc";
import { TagButtons } from "@/components/ui/TagButton";
import { DownloadBtn } from "@/components/ui/DownloadBtn";
import { LikeButton } from "@/components/ui/LikeButton";
import { AddToCollectionBtn } from "@/components/ui/AddToCollectionBtn";
import {
  getMediaItemDetailAPI,
  updateMediaItemAPI,
  deleteMediaItemAPI, // 삭제 API 추가
} from "@/lib/APIs";
import { AWS_BASE_URL } from "@/constants";
import { useLoading } from "@/contexts/LoadingProvider";
import { formatDate } from "@/lib/utils";
import { startDownloadItem } from "@/lib/downloadFiles";
import CustomLocalStorage from "@/lib/CustomLocalStorage";
import { GetMediaItemDetailResDto } from "@/types/api-dtos";

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [isInit, setIsInit] = useState(true);
  const [mediaDetail, setMediaDetail] = useState<GetMediaItemDetailResDto | null>(null);
  const [showSlideshow, setShowSlideshow] = useState(false);

  // --- 수정/삭제 관련 상태 ---
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  // -----------------------

  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    getSingleMediaItem();
  }, [id]);

  const getSingleMediaItem = async () => {
    showLoading();
    const res = await getMediaItemDetailAPI({ id });
    if (res.code === 200) {
      setMediaDetail(res.data);
      setEditTitle(res.data.title || "");
      setEditDesc(res.data.description || "");
    }
    setIsInit(false);
    hideLoading();
  };

  // --- 수정 처리 핸들러 ---
  const handleUpdate = async () => {
    if (!editTitle.trim()) return alert("제목을 입력해주세요.");

    showLoading();
    const res = await updateMediaItemAPI({
      contentId: id,
      title: editTitle,
      description: editDesc,
    });
    console.log("updateMediaItemAPI res : ", res.data);
    hideLoading();
    if (res.code === 202) {
      setMediaDetail((prev) =>
        prev ? { ...prev, title: editTitle, description: editDesc } : null,
      );
      setIsEditing(false);
      alert("콘텐츠가 수정되었습니다.");
    }
  };

  // --- 삭제 처리 핸들러 ---
  const handleDelete = async () => {
    if (!confirm("정말로 이 콘텐츠를 영구 삭제하시겠습니까?")) return;

    showLoading();
    const res = await deleteMediaItemAPI(id);
    hideLoading();
    if (res.code === 200) {
      alert("삭제되었습니다.");
      router.push("/"); // 삭제 후 메인으로 이동
    }
  };

  const handleDownload = () => {
    if (!mediaDetail) return;
    startDownloadItem(mediaDetail.id);
  };

  if (isInit) return null;
  if (!mediaDetail) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 pt-16">
        <h1 className="text-2xl font-bold text-gray-800">404 - 콘텐츠를 찾을 수 없습니다.</h1>
      </main>
    );
  }

  const userInfo = CustomLocalStorage.getUserInfo();
  // 작성자 본인 확인 (id 비교)
  const isOwner = userInfo && userInfo.id === mediaDetail.ownerId;
  const mediaClassName = "w-full h-auto object-contain max-h-[80vh] min-h-[30vh]";

  return (
    <main className="w-full h-full py-5">
      <div className="container mx-auto">
        <div className="flex w-full flex-col overflow-hidden bg-white">
          {/* 미디어 렌더링 영역 */}
          <div className="flex w-full max-h-screen items-center justify-center">
            {mediaDetail.type === "IMAGE" && mediaDetail.keyImageLarge && (
              <div
                onClick={() => !isEditing && setShowSlideshow(true)}
                className={isEditing ? "" : "cursor-pointer"}
              >
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

          {/* 정보 및 제어 영역 */}
          <div className="flex w-full flex-col gap-6 p-6 md:p-8">
            <div className="flex flex-col gap-4 border-b pb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-3xl font-bold border-b-2 border-blue-500 outline-none pb-1"
                      autoFocus
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                      {mediaDetail.title}
                    </h1>
                  )}
                </div>

                <div className="flex-shrink-0 flex items-center space-x-2 ml-4">
                  {/* 본인일 때 수정/삭제 버튼 노출 */}
                  {isOwner && !isEditing && (
                    <div className="flex gap-2 mr-4 pr-4 border-r">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm font-medium text-gray-500 hover:text-blue-600 transition"
                      >
                        수정
                      </button>
                      <button
                        onClick={handleDelete}
                        className="text-sm font-medium text-gray-500 hover:text-red-600 transition"
                      >
                        삭제
                      </button>
                    </div>
                  )}

                  <DownloadBtn onClick={handleDownload} />
                  {userInfo && (
                    <>
                      <LikeButton
                        isLiked={mediaDetail.isLikedByCurrentUser}
                        mediaItemId={mediaDetail.id}
                      />
                      <AddToCollectionBtn mediaId={mediaDetail.id} />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 유저 정보 영역 */}
            <UserInfoArea
              profileImageKey={mediaDetail.ownerProfileImageKey}
              name={mediaDetail.ownerNickname}
              uploadedDate={formatDate(mediaDetail.createdAt)}
            />

            {/* 설명 영역: 수정 모드일 때 textarea로 변경 */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full min-h-[100px] p-3 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  placeholder="내용을 입력하세요..."
                />
              ) : (
                <ContentDesc description={mediaDetail.description || ""} />
              )}
            </div>

            {/* 수정 모드일 때 하단 저장/취소 버튼 */}
            {isEditing && (
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(mediaDetail.title || "");
                    setEditDesc(mediaDetail.description || "");
                  }}
                  className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-full transition"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-8 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                  저장하기
                </button>
              </div>
            )}

            <TagButtons tagsArray={mediaDetail.tags} />
          </div>
        </div>
      </div>

      {showSlideshow && mediaDetail.type === "IMAGE" && (
        <Slideshow
          images={[{ src: AWS_BASE_URL + mediaDetail.keyImageLarge, name: mediaDetail.title }]}
          startIndex={0}
          onClose={() => setShowSlideshow(false)}
        />
      )}
    </main>
  );
}
