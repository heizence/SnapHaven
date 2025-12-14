"use client";

import React, { useState, useContext, createContext, ReactNode } from "react";
import { CommonAlertModal } from "@/components/modals/CommonAlertModal";
import { CreateNewCollectionModal } from "@/components/modals/CreateNewCollectionModal";
import { AddContentToCollectionModal } from "@/components/modals/AddContentToCollectionModal";
import { CollectionContentType } from "@/lib/interfaces";

export interface AlertModalParams {
  type: "success" | "error";
  title: string;
  message: string;
  onClose?: () => void;
}

export interface CollectionModalParams {
  onSubmit?: () => void;
  onClose?: () => void;
  contentId?: number;
  contentType?: CollectionContentType;
}

interface ModalContextType {
  openAlertModal: (params: AlertModalParams) => void;
  openCreateNewCollectionModal: (params: CollectionModalParams) => void;
  openAddToCollectionModal: (params: CollectionModalParams) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);

  const closeModal = () => {
    setModalContent(null);
  };

  // 모달 : 기본 알림
  const openAlertModal = ({ type, title, message, onClose }: AlertModalParams) => {
    setModalContent(
      <CommonAlertModal
        type={type}
        title={title}
        message={message}
        onClose={() => {
          closeModal();
          if (onClose) {
            onClose();
          }
        }}
      />
    );
  };

  // 모달 : 새 컬렉션 생성 후 콘텐츠 추가
  const openCreateNewCollectionModal = ({
    onSubmit,
    onClose,
    contentId,
    contentType,
  }: CollectionModalParams) => {
    setModalContent(
      <CreateNewCollectionModal
        onSubmit={onSubmit}
        onClose={() => {
          closeModal();
          if (onClose) {
            onClose();
          }
        }}
        contentId={contentId}
        contentType={contentType}
      />
    );
  };

  // 모달 : 컬렉션에 콘텐츠 추가
  const openAddToCollectionModal = ({
    onSubmit,
    onClose,
    contentId,
    contentType,
  }: CollectionModalParams) => {
    setModalContent(
      <AddContentToCollectionModal
        onSubmit={onSubmit}
        onClose={() => {
          closeModal();
          if (onClose) {
            onClose();
          }
        }}
        contentId={contentId}
        contentType={contentType}
      />
    );
  };

  const value = {
    openAlertModal,
    openCreateNewCollectionModal,
    openAddToCollectionModal,
    closeModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modalContent}
    </ModalContext.Provider>
  );
};

// 6. useModal 훅 (기존과 동일)
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
