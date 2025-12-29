"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { throttle } from "lodash";
import { Plus, X } from "lucide-react";
import "react-photo-album/masonry.css";
import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/ModalProvider";
import RenderContents from "@/components/RenderContents";
import NoDataMessage from "@/components/ui/NoDataMessage";
import {
  deleteCollectionAPI,
  getCollectionContentsAPI,
  getMyCollectionsAPI,
  editCollectionAPI,
} from "@/lib/APIs";

import { useLoading } from "@/contexts/LoadingProvider";
import { AWS_BASE_URL, ITEM_REQUEST_LIMIT } from "@/constants";
import { ContentType } from "@/constants/enums";
import { Collection, EditCollectionReqDto, GetCollectionContentsReqDto } from "@/types/api-dtos";
import { Photo } from "@/types/data";

export default function MyCollectionsPage() {
  const [isInit, setIsInit] = useState(true);

  const [collectionFolders, setCollectionFolders] = useState<Collection[]>([]); // 상단 컬렉션 목록
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null); // 선택된 컬렉션

  const [allContents, setAllContents] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 컬렉션 수정 기능을 위한 상태
  const [isEditMode, setIsEditMode] = useState(false); // 편집 모드 상태
  const [newCollectionName, setNewCollectionName] = useState(selectedCollection?.name || ""); // 새 컬렉션 이름
  const [selectedItemKeys, setSelectedItemKeys] = useState<number[]>([]); // 선택된 아이템 목록

  const router = useRouter();
  const { openCreateNewCollectionModal } = useModal();
  const { showLoading, hideLoading } = useLoading();

  // 스크롤 보존용 ref
  const scrollPositionRef = useRef(0);

  // 컬렉션 목록 기본정보 불러오기
  const getMyCollectionList = async () => {
    if (isInit) {
      showLoading();
    }

    const res = await getMyCollectionsAPI();

    if (res.code === 200) {
      const data = res.data;
      setCollectionFolders(data);

      if (data.length > 0) {
        const firstCollection = data[0];
        await getCollectionContents(firstCollection);
      }
    }
    hideLoading();
    setIsInit(false);
  };

  // 각 컬렉션 내 콘텐츠 불러오기
  const getCollectionContents = async (
    _collection: Collection,
    forcedPage?: number,
    isRefresh?: boolean
  ) => {
    setSelectedCollection(_collection); // 기본 선택

    const request: GetCollectionContentsReqDto = {
      collectionId: _collection.id,
      page: forcedPage ?? page,
    };
    const res = await getCollectionContentsAPI(request);
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
      }));

      if (isRefresh) {
        setAllContents(photos);
      } else {
        setAllContents((prev) => [...prev, ...photos]);
      }

      setPage((prev) => prev + 1);

      if (items.length < ITEM_REQUEST_LIMIT) {
        setHasMore(false);
      }
    }
  };

  const handleItemOnclick = (photo: Photo) => {
    if (isEditMode) {
      // 편집 모드일 때는 선택 상태 토글
      setSelectedItemKeys((prev) =>
        prev.includes(photo.key) ? prev.filter((k) => k !== photo.key) : [...prev, photo.key]
      );
    } else {
      // 일반 모드일 때는 이동
      if (photo.albumId) {
        router.push(`/album/${photo.albumId}`);
      } else {
        router.push(`/content/${photo.key}`);
      }
    }
  };

  const handleCreateNewCollection = () => {
    openCreateNewCollectionModal({
      onSubmit: (res) => {
        setCollectionFolders((prev) => [...prev, res.data]);
      },
    });
  };

  const handleDeleteCollection = async () => {
    if (!selectedCollection) return;
    const isSure = confirm("컬렉션을 삭제하시겠습니까?");
    if (!isSure) return;

    const res = await deleteCollectionAPI(selectedCollection.id);
    if (res.code === 202) {
      let temp = [...collectionFolders];
      temp = temp.filter((each) => each.id !== res.data?.deletedCollectionId);
      setCollectionFolders(temp);
      setSelectedCollection(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedItemKeys([]);
    setNewCollectionName(selectedCollection?.name || "");
  };

  // 컬렉션 최종 수정
  // TODO : 추후 컬렉션 내 콘텐츠 제거 기능 구현하기
  const handleEditCollection = async () => {
    if (!selectedCollection) return;

    showLoading();
    const request: EditCollectionReqDto = {
      collectionId: selectedCollection.id,
      name: newCollectionName,
    };

    const res = await editCollectionAPI(request);
    if (res.code === 200) {
      const editedCollection = res.data;

      setSelectedCollection((prev) => ({
        ...prev!,
        name: editedCollection.name,
      }));

      const temp = [...collectionFolders];
      const editedColIndex = collectionFolders?.findIndex(
        (each) => each.id === editedCollection.id
      );

      if (editedColIndex !== -1) {
        temp[editedColIndex] = {
          ...editedCollection,
          thumbnailKey: temp[editedColIndex].thumbnailKey,
        };
        setCollectionFolders([...temp]);
      }
    }

    // 프론트엔드 즉시 반영(추후 구현)
    // setAllContents((prev) =>
    //   prev.filter((item) => !selectedItemKeys.includes(item.key as number))
    // );
    // setSelectedItemKeys([]);
    // setIsEditMode(false);

    // 상단 폴더 카운트 업데이트 로직 추가 필요
    hideLoading();
    setIsEditMode(false);
  };

  useEffect(() => {
    getMyCollectionList();
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [selectedCollection]);

  // 스크롤 이벤트
  useEffect(() => {
    const handleScrollLogic = () => {
      const bottom =
        window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 400;

      if (bottom && hasMore) {
        scrollPositionRef.current = window.scrollY; // 현재 위치 저장
        if (selectedCollection) getCollectionContents(selectedCollection);
      }
    };

    const throttledHandleScroll = throttle(handleScrollLogic, 200);

    window.addEventListener("scroll", throttledHandleScroll);
    return () => {
      window.removeEventListener("scroll", throttledHandleScroll);
      throttledHandleScroll.cancel();
    };
  }, [getCollectionContents, hasMore]);

  return (
    <main className="w-full min-h-[calc(100vh-56px)] bg-white px-5">
      <div className="container mx-auto py-5">
        <div className="flex w-full flex-col rounded-xl bg-white">
          {/* --- 1. 상단: 컬렉션 정보 --- */}
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-900">내 컬렉션</h1>
              <Button
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                onClick={handleCreateNewCollection}
              >
                <Plus size={16} />
                <span>새 컬렉션 생성</span>
              </Button>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">목록</h2>
            {/* 컬렉션 목록 그리드 */}

            {collectionFolders.length === 0 ? (
              <div className="mt-10">
                <NoDataMessage
                  message="컬렉션이 없습니다"
                  show={!isInit && allContents.length === 0}
                />
              </div>
            ) : (
              <div className="h-70 overflow-x-auto custom-scrollbar p-2">
                <div className="flex flex-row flex-nowrap gap-4">
                  {collectionFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => getCollectionContents(folder, 1, true)}
                      className={`relative aspect-square transition-all hover:shadow-md group flex-shrink-0
                      w-[calc(33.33%-12px)] sm:w-[calc(25%-12px)] md:w-[calc(20%-12px)] lg:w-[calc(16.66%-12px)]
                      max-w-[250px] rounded-lg overflow-hidden shadow-sm
                      ${
                        selectedCollection?.id === folder.id
                          ? "ring-2 ring-blue-600 ring-offset-2"
                          : "hover:border-gray-300"
                      }
                    `}
                    >
                      {/* 썸네일 이미지 */}
                      {folder.thumbnailKey && (
                        <Image
                          src={AWS_BASE_URL + folder.thumbnailKey}
                          alt={folder.name}
                          fill
                          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                      {/* 그라데이션 오버레이 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      {/* 하단 텍스트 */}
                      <div className="absolute bottom-3 left-3 text-left text-white">
                        <p className="font-semibold">{folder.name}</p>
                        <p className="text-sm">{folder.itemCount}개 아이템</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 컬렉션 콘텐츠 --- */}
          {selectedCollection && (
            <div className="p-6 md:p-8 border-t border-gray-200">
              <div className="flex justify-between items-center mb-6">
                {/* 컬렉션 타이틀 표시 */}
                {isEditMode ? (
                  <input
                    type="text"
                    className="w-full text-2xl md:text-3xl pt-1 pb-1 font-bold text-gray-900 border-2 border-rounded border-blue-600 max-w-[600px]"
                    defaultValue={selectedCollection.name}
                    onChange={(e) => {
                      setNewCollectionName(e.target.value);
                    }}
                  />
                ) : (
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
                    {selectedCollection.name}
                  </h2>
                )}
                {/* 버튼 그룹 전환 */}
                <div className="flex space-x-2">
                  {!isEditMode ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
                        이름 수정
                      </Button>

                      <Button variant="destructive" size="sm" onClick={handleDeleteCollection}>
                        삭제
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        <X size={16} /> 취소
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleEditCollection}
                        className="bg-blue-600"
                      >
                        완료
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {allContents.length > 0 && (
                <RenderContents
                  photos={allContents}
                  onClick={({ photo }: { photo: Photo }) => handleItemOnclick(photo)}
                />
              )}

              {/* No Data */}
              <div className="mt-10">
                <NoDataMessage
                  message="콘텐츠가 없습니다"
                  show={!isInit && allContents.length === 0}
                />
              </div>

              <NoDataMessage
                message="모든 콘텐츠를 불러왔습니다."
                show={!isInit && !hasMore && allContents.length > 0}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
