"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface LoadingContextType {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

function LoadingOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Pointer Events: 오버레이가 투명하더라도 아래 요소와의 상호작용을 차단
        pointerEvents: "auto",
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
    </div>
  );
}

// Provider 컴포넌트
export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const showLoading = () => setIsLoading(true);
  const hideLoading = () => setIsLoading(false);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
      {isLoading && <LoadingOverlay />}
    </LoadingContext.Provider>
  );
}

// Custom Hook: 컴포넌트에서 showLoading/hideLoading 함수를 호출하기 위함
export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
