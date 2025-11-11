"use client";

import React, { useState, useEffect, useRef } from "react";
import NextImage from "next/image";
import { ChevronLeft, ChevronRight, X, Play, Pause, Maximize, Minimize } from "lucide-react";

interface SlideshowImage {
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
  const [isHovering, setIsHovering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const slideshowRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const wheelTimeout = useRef<NodeJS.Timeout | null>(null);

  const [showToast, setShowToast] = useState(false);

  // 컴포넌트 마운트 시 토스트 표시 로직
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShowToast(true);
    }, 200);
    const hideTimer = setTimeout(() => {
      setShowToast(false);
    }, 3000);
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

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen && slideshowRef.current) {
      slideshowRef.current.requestFullscreen();
    } else if (isFullscreen) {
      document.exitFullscreen();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (images.length > 1) {
        if (e.key === "ArrowRight") goToNext();
        else if (e.key === "ArrowLeft") goToPrev();
      }

      if (e.key === "Escape") {
        onClose();
      }

      // 'f' 키로 전체화면 토글 기능 추가
      if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, images.length, isFullscreen]);

  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const goToPrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
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
    e.preventDefault();
    if (wheelTimeout.current) return;
    if (e.deltaX > 5 || e.deltaY > 5) {
      goToNext();
    } else if (e.deltaX < -5 || e.deltaY < -5) {
      goToPrev();
    }
    wheelTimeout.current = setTimeout(() => {
      wheelTimeout.current = null;
    }, 300);
  };

  const arrowButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.3)",
    border: "none",
    cursor: "pointer",
    borderRadius: "50%",
    padding: "8px",
    opacity: isHovering ? 1 : 0,
    transition: "opacity 0.2s ease-in-out",
    zIndex: 1002,
  };

  return (
    <div
      ref={slideshowRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onWheel={handleWheel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 토스트 메시지 */}
      <div
        style={{
          position: "absolute",
          top: showToast ? "20px" : "-50px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "10px 20px",
          borderRadius: "20px",
          fontSize: "14px",
          zIndex: 1004,
          transition: "top 0.3s ease-in-out, opacity 0.3s ease-in-out", // [수정] opacity 추가
          opacity: showToast ? 1 : 0,
        }}
      >
        전체화면은 F, 슬라이드 종료는 Esc 키를 눌러주세요.
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          zIndex: 1003,
        }}
      >
        <X color="white" size={32} />
      </button>

      {/* Main Image Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <NextImage
          src={images[currentIndex].src}
          alt={images[currentIndex].name || ""}
          fill
          className="object-contain"
          priority
        />

        {images.length > 1 && (
          <>
            <button onClick={goToPrev} style={{ ...arrowButtonStyle, left: "20px" }}>
              <ChevronLeft color="white" size={32} />
            </button>
            <button onClick={goToNext} style={{ ...arrowButtonStyle, right: "20px" }}>
              <ChevronRight color="white" size={32} />
            </button>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          display: "flex",
          gap: "20px",
          background: "rgba(0,0,0,0.3)",
          padding: "10px 20px",
          borderRadius: "20px",
          color: "white",
          alignItems: "center",
          userSelect: "none",
          zIndex: 1002,
        }}
      >
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              {isPlaying ? <Pause color="white" /> : <Play color="white" />}
            </button>
            <span style={{ fontSize: "14px", minWidth: "50px", textAlign: "center" }}>
              {currentIndex + 1} / {images.length}
            </span>
          </>
        )}

        {/* Fullscreen 버튼 */}
        <button
          onClick={toggleFullscreen}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          {isFullscreen ? <Minimize color="white" /> : <Maximize color="white" />}
        </button>
      </div>
    </div>
  );
};

export default Slideshow;
