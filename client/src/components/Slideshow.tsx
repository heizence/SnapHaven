"use client";

import React, { useState, useEffect, useRef } from "react";
import NextImage from "next/image";
import { ChevronLeft, ChevronRight, X, Play, Pause, Maximize, Minimize } from "lucide-react";

export interface SlideshowImage {
  src: string;
  name?: string;
}

interface SlideshowProps {
  images: SlideshowImage[];
  startIndex?: number;
  onClose: () => void;
}

const Slideshow: React.FC<SlideshowProps> = ({ images, startIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 마우스 이동 감지 상태
  const [showControls, setShowControls] = useState(true);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const slideshowRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const wheelTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showToast, setShowToast] = useState(false);

  // 1. 마우스 유휴 상태 감지 로직
  const handleMouseMove = () => {
    setShowControls(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    // 3초 후 컨트롤 숨김
    idleTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    // 초기 마운트 시 타이머 시작
    handleMouseMove();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // 컴포넌트 마운트 시 토스트 표시
  useEffect(() => {
    const showTimer = setTimeout(() => setShowToast(true), 200);
    const hideTimer = setTimeout(() => setShowToast(false), 3000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Autoplay
  useEffect(() => {
    if (isPlaying && images.length > 1) {
      const timer = setInterval(goToNext, 3000);
      return () => clearInterval(timer);
    }
  }, [isPlaying, currentIndex, images.length]);

  const toggleFullscreen = () => {
    if (!isFullscreen && slideshowRef.current) {
      slideshowRef.current.requestFullscreen();
    } else if (isFullscreen) {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (images.length > 1) {
        if (e.key === "ArrowRight") goToNext();
        else if (e.key === "ArrowLeft") goToPrev();
        // 2. 스페이스바 (재생/일시정지)
        else if (e.key === " " || e.key === "Spacebar") {
          // 브라우저 호환성을 위해 두 케이스 체크
          e.preventDefault(); // 페이지 스크롤 방지
          setIsPlaying((prev) => !prev);
          handleMouseMove(); // 키 입력 시에도 컨트롤 표시
        }
      }

      if (e.key === "Escape") onClose();
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, images.length, isFullscreen]);

  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const goToPrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (images.length <= 1) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (images.length <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    if (touchStartX.current - touchEndX > 50) goToNext();
    if (touchEndX - touchStartX.current > 50) goToPrev();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (images.length <= 1) return;
    if (wheelTimeout.current) return;
    if (Math.abs(e.deltaX) > 10 || Math.abs(e.deltaY) > 10) {
      if (e.deltaX > 0 || e.deltaY > 0) goToNext();
      else goToPrev();
      wheelTimeout.current = setTimeout(() => (wheelTimeout.current = null), 400);
    }
  };

  // 공통 버튼 스타일
  const controlBtnBase = "transition-opacity duration-300 ease-in-out z-[1002]";
  const arrowBtnStyle = `${controlBtnBase} absolute top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 p-3 rounded-full text-white cursor-pointer hidden md:block`;

  return (
    <div
      ref={slideshowRef}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      className="fixed inset-0 bg-black/95 z-[1000] flex items-center justify-center overflow-hidden touch-none"
    >
      {/* 1. 토스트 메시지 */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 bg-black/70 text-white px-5 py-2.5 rounded-full text-sm z-[1004] transition-all duration-500
        ${showToast ? "top-5 opacity-100" : "-top-12 opacity-0"}`}
      >
        전체화면은 F, 슬라이드 재생은 Space Bar 키를 눌러주세요.
      </div>

      {/* 2. Close Button */}
      <button
        onClick={onClose}
        className={`absolute top-5 right-5 text-white p-2 hover:bg-white/10 rounded-full z-[1003] ${controlBtnBase} 
        ${showControls ? "opacity-100" : "opacity-0 cursor-none"}`}
      >
        <X size={32} />
      </button>

      {/* 3. Main Content Container */}
      <div className="relative w-full h-full flex items-center justify-center select-none">
        <NextImage
          src={images[currentIndex].src}
          alt={images[currentIndex].name || ""}
          fill
          className="object-contain"
          priority
        />

        {/* 4. Navigation Arrows */}
        {images.length > 1 && (
          <div className={`${showControls ? "opacity-100" : "opacity-0 cursor-none"}`}>
            <button onClick={goToPrev} className={`${arrowBtnStyle} left-5`}>
              <ChevronLeft size={36} />
            </button>
            <button onClick={goToNext} className={`${arrowBtnStyle} right-5`}>
              <ChevronRight size={36} />
            </button>
          </div>
        )}
      </div>

      {/* 5. Bottom Controls */}
      <div
        className={`absolute bottom-8 flex items-center gap-6 bg-black/40 backdrop-blur-sm px-6 py-3 rounded-full text-white z-[1002] transition-opacity duration-300
        ${showControls ? "opacity-100" : "opacity-0 cursor-none"}`}
      >
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="hover:scale-110 transition-transform"
            >
              {isPlaying ? <Pause fill="white" /> : <Play fill="white" />}
            </button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {currentIndex + 1} / {images.length}
            </span>
          </>
        )}

        <button onClick={toggleFullscreen} className="hover:scale-110 transition-transform">
          {isFullscreen ? <Minimize /> : <Maximize />}
        </button>
      </div>
    </div>
  );
};

export default Slideshow;
