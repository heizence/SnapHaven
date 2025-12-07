"use client";

import React, { useState } from "react";
import { MasonryPhotoAlbum } from "react-photo-album";
import { BookmarkIcon, DownloadIcon, ImageIcon, ListIcon, VideoIcon } from "./ui/SvgIcons";
import "react-photo-album/masonry.css";
import { LikeButtonForFeeds } from "./ui/LikeButton";
import { ContentType } from "@/lib/consts";

const RenderEachContent = ({ photo, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLikeHovered, setIsLikeHovered] = useState(false);
  const [isBookmarkHovered, setIsBookmarkHovered] = useState(false);
  const [isDownloadHovered, setIsDownloadHovered] = useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    alert(`${action}`);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // optional: 처음 프레임으로 리셋
    }
  };

  const bottmBtnStyle = `bg-none border-none cursor-pointer p-[10px] 
  rounded-[10px] transition-transform duration-150 ease`;

  return (
    <div
      className="relative cursor-pointer overflow-hidden rounded w-full h-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => onClick({ event: e, photo })}
    >
      {photo.type === ContentType.IMAGE ? (
        <img className="w-full h-auto bg-black/40" src={photo.src} alt={photo.title || ""} />
      ) : (
        <video
          ref={videoRef}
          key={photo.key}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            backgroundColor: `rgba(0,0,0, 0.4)`,
          }}
          width={photo.width}
          height={photo.height}
          controls={false}
          muted
          loop
          playsInline // Important for playback on iOS
        >
          <source src={photo.videoPreview} type={"video/mp4"} />
          Your browser does not support the video tag.
        </video>
      )}
      <div
        style={{
          position: "absolute",
          top: 15,
          left: 15,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          {photo.type === ContentType.IMAGE ? (
            photo.albumId ? (
              <ListIcon size={30} />
            ) : (
              <ImageIcon size={30} />
            )
          ) : (
            <VideoIcon size={30} />
          )}
        </div>
      </div>

      <div
        className={`
        absolute inset-0 text-white 
        flex flex-col justify-end p-4
        transition-opacity duration-200 ease-in-out
        ${isHovered ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
      `}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <div
            className={`
              flex
            ${bottmBtnStyle}
            ${isLikeHovered ? "bg-black/70" : ""}
            `}
            onMouseEnter={() => setIsLikeHovered(true)}
            onMouseLeave={() => setIsLikeHovered(false)}
          >
            <LikeButtonForFeeds isLiked={false} />
          </div>
          <button
            className={`
            ${bottmBtnStyle}
            ${isBookmarkHovered ? "bg-black/70" : ""}
            `}
            onMouseEnter={() => setIsBookmarkHovered(true)}
            onMouseLeave={() => setIsBookmarkHovered(false)}
            onClick={(e) => handleActionClick(e, "Bookmark")}
          >
            <BookmarkIcon />
          </button>
          <button
            onMouseEnter={() => setIsDownloadHovered(true)}
            onMouseLeave={() => setIsDownloadHovered(false)}
            className={`
            ${bottmBtnStyle}
            ${isDownloadHovered ? "bg-black/70" : ""}
            `}
            onClick={(e) => handleActionClick(e, "Download")}
          >
            <DownloadIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function RenderAlbum({ photos, onClick }) {
  return (
    <MasonryPhotoAlbum
      photos={photos}
      columns={(containerWidth) => {
        if (containerWidth < 600) return 2;
        if (containerWidth < 1500) return 3;
        return 4;
      }}
      spacing={5} // 사진 사이 간격 (선택 사항)
      padding={0} // 앨범 컨테이너 내부 여백 (선택 사항)
      targetRowHeight={150}
      rowConstraints={{ singleRowMaxHeight: 250 }}
      onClick={onClick}
      render={{
        photo: ({ onClick }, { photo }) => (
          <RenderEachContent key={photo.key} photo={photo} onClick={onClick} />
        ),
      }}
    />
  );
}
