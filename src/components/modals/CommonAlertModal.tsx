"use client";

import React from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";

interface CommonAlertModalProps {
  type: "success" | "error";
  title: string;
  message: string;
  onClose: () => void;
}

export const CommonAlertModal: React.FC<CommonAlertModalProps> = ({
  type,
  title,
  message,
  onClose,
}) => {
  const isSuccess = type === "success";

  const Icon = isSuccess ? CheckCircle : AlertCircle;
  const iconColor = isSuccess ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600";
  const buttonColor = isSuccess
    ? "bg-blue-600 hover:bg-blue-700 text-white"
    : "bg-red-600 hover:bg-red-700 text-white";

  return (
    // Backdrop (배경)
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    >
      {/* Modal 본체 */}
      <div
        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫힘 방지
        className="relative flex w-full max-w-sm flex-col items-center rounded-xl bg-white p-8 text-center shadow-xl"
      >
        {/* 닫기 버튼 (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        {/* 아이콘 (성공/실패) */}
        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${iconColor}`}>
          <Icon size={40} />
        </div>

        <h2 className="mt-6 text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{message}</p>

        <button
          onClick={onClose}
          className={`mt-6 w-full rounded-lg px-6 py-3 font-semibold transition-colors ${buttonColor}`}
        >
          확인
        </button>
      </div>
    </div>
  );
};
