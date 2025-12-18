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
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          border: "4px solid #e5e7eb", // 회색 배경 원
          borderTop: "4px solid #2563eb", // 파란색 회전 부분
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      {/* keyframes 애니메이션 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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
