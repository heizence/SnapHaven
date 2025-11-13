"use client";

import React, { useState, useContext, createContext, ReactNode } from "react";
import { CommonAlertModal } from "@/components/modals/CommonAlertModal";

export interface AlertModalParams {
  type: "success" | "error";
  title: string;
  message: string;
  onClose?: () => void;
}

interface ModalContextType {
  openAlertModal: (params: AlertModalParams) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);

  const closeModal = () => {
    setModalContent(null);
  };

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

  const value = {
    openAlertModal,
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
