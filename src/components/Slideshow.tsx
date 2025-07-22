"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  PlayIcon,
  PauseIcon,
  FullscreenIcon,
  ExitFullscreenIcon,
} from "./ui/SvgIcons";

const Image = ({ src, alt }) => {
  const style: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };
  return <img src={src} alt={alt || ""} style={style} />;
};

// --- Interface ---
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
  const [isFullscreen, setIsFullscreen] = useState(false); // FIX: 전체 화면 상태 관리
  const slideshowRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const wheelTimeout = useRef<NodeJS.Timeout | null>(null); // FIX: 휠 이벤트 쓰로틀링을 위한 ref

  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const goToPrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  // Autoplay
  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(goToNext, 3000);
      return () => clearInterval(timer);
    }
  }, [isPlaying, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNext();
      else if (e.key === "ArrowLeft") goToPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // FIX: 전체 화면 변경 감지 (예: 유저가 Esc 키를 누를 때)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    if (touchStartX.current - touchEndX > 50) goToNext();
    if (touchEndX - touchStartX.current > 50) goToPrev();
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen && slideshowRef.current) {
      slideshowRef.current.requestFullscreen();
    } else if (isFullscreen) {
      document.exitFullscreen();
    }
  };

  // FIX: 휠 스크롤로 슬라이드 넘기기 (쓰로틀링 적용)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault(); // 페이지 스크롤 방지
    if (wheelTimeout.current) return; // 이미 타이머가 있으면 무시

    if (e.deltaX > 5) {
      // 오른쪽으로 스크롤
      goToNext();
    } else if (e.deltaX < -5) {
      // 왼쪽으로 스크롤
      goToPrev();
    }

    wheelTimeout.current = setTimeout(() => {
      wheelTimeout.current = null;
    }, 300); // 300ms 쓰로틀
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
  };

  return (
    <div
      ref={slideshowRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onWheel={handleWheel} // FIX: 휠 이벤트 핸들러 추가
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
          zIndex: 1001,
        }}
      >
        <CloseIcon />
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
        <Image
          src={images[currentIndex].src}
          alt={images[currentIndex].name}
          fill
          className="object-contain"
          priority
        />
        <button onClick={goToPrev} style={{ ...arrowButtonStyle, left: "20px" }}>
          <ChevronLeftIcon />
        </button>
        <button onClick={goToNext} style={{ ...arrowButtonStyle, right: "20px" }}>
          <ChevronRightIcon />
        </button>
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
        }}
      >
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        {/* FIX: 페이지 카운터 표시 */}
        <span style={{ fontSize: "14px", minWidth: "50px", textAlign: "center" }}>
          {currentIndex + 1} / {images.length}
        </span>
        {/* FIX: 동적 전체 화면 아이콘 */}
        <button
          onClick={toggleFullscreen}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
        </button>
      </div>
    </div>
  );
};

export default Slideshow;
