"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { EachContent } from "@/lib/interfaces";
import { BookmarkIcon, DownloadIcon, ImageIcon, VideoIcon, ListIcon } from "./ui/SvgIcons";

// Component which renders each contents(photo, video)
const RenderEachContent = ({ file, onClick, isCollection }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isBookmarkHovered, setIsBookmarkHovered] = useState(false);
  const [isDownloadHovered, setIsDownloadHovered] = useState(false);

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    alert(`${action} photo by ${file.authorName}`);
  };

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    color: "white",
    opacity: isHovered ? 1 : 0,
    transition: "opacity 0.2s ease-in-out",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: "1rem",
    pointerEvents: isHovered ? "auto" : "none",
  };

  // Style for top right action buttons with hover effect
  const bottomBtnStyle = (hovered: boolean): React.CSSProperties => ({
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 10,
    backgroundColor: hovered ? "rgba(0, 0, 0, 0.7)" : "",
    borderRadius: 10,
    transition: "transform 0.15s ease",
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        cursor: "pointer",
        overflow: "hidden",
        borderRadius: "4px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => onClick({ event: e, file })}
    >
      {file.type.includes("image") ? (
        <Image
          src={file.src}
          alt={file.name || ""}
          width={1000}
          height={1000}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <video
          key={file.id}
          style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "black" }}
          width="100%" // Make the video responsive to its container
          height="auto"
          controls={false} // Show default video controls (play, pause, volume, etc.)
          autoPlay={false} // Start playing automatically
          muted // Mute by default (required by most browsers for autoplay)
          loop // Loop the video when it ends
          playsInline // Important for playback on iOS
        >
          <source src={file.src} type={file.type} />
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
        {!isCollection && (
          <div>
            {file.type.includes("image") ? (
              file.isInList === 1 ? (
                <ListIcon size={30} />
              ) : (
                <ImageIcon size={30} />
              )
            ) : (
              <VideoIcon size={30} />
            )}
          </div>
        )}
      </div>
      <div style={overlayStyle}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <button
            onMouseEnter={() => setIsBookmarkHovered(true)}
            onMouseLeave={() => setIsBookmarkHovered(false)}
            style={bottomBtnStyle(isBookmarkHovered)}
            onClick={(e) => handleActionClick(e, "Bookmark")}
          >
            <BookmarkIcon />
          </button>
          <button
            onMouseEnter={() => setIsDownloadHovered(true)}
            onMouseLeave={() => setIsDownloadHovered(false)}
            style={bottomBtnStyle(isDownloadHovered)}
            onClick={(e) => handleActionClick(e, "Download")}
          >
            <DownloadIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

// Album which renders all contents(photos, videos)
const ColumnsAlbum = ({ data, onClick, openSlideshow, isCollection }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [computedRows, setComputedRows] = useState<EachContent[][]>([]);

  // Effect to make the layout responsive
  useLayoutEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Effect to calculate the justified layout
  useEffect(() => {
    if (containerWidth === 0 || data.length === 0) return;

    const rows: EachContent[][] = [];
    let currentRow: EachContent[] = [];
    let currentRowWidth = 0;
    const gap = 10; // The space between photos

    data.forEach((each: EachContent) => {
      const aspectRatio = each.width / each.height;
      const estimatedWidth = 250 * aspectRatio; // By setting number(250), can adjust the number of contents per 1 row

      if (currentRowWidth + estimatedWidth > containerWidth && currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [each];
        currentRowWidth = estimatedWidth + gap;
      } else {
        currentRow.push(each);
        currentRowWidth += estimatedWidth + gap;
      }
    });
    if (currentRow.length > 0) rows.push(currentRow);

    setComputedRows(rows);
  }, [data, containerWidth]);

  const layout = (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {computedRows.map((row, rowIndex) => {
        // Calculate the total aspect ratio of the row
        const totalAspectRatio = row.reduce((acc, file) => acc + file.width / file.height, 0);
        // Calculate the height this row should have to fill the container width
        const rowHeight = (containerWidth - (row.length - 1) * 10) / totalAspectRatio;

        return (
          <div key={rowIndex} style={{ display: "flex", gap: "10px", height: `${rowHeight}px` }}>
            {row.map((file, fileIndex) => (
              <div key={file.id} style={{ flex: `${file.width / file.height}` }}>
                <RenderEachContent
                  file={file}
                  onClick={
                    isCollection
                      ? () =>
                          openSlideshow(computedRows.slice(0, rowIndex).flat().length + fileIndex)
                      : onClick
                  }
                  isCollection={isCollection}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );

  return layout;
};

// Main Component which is exported by default
const RenderAlbum = ({ data, isCollection = false, openSlideshow }) => {
  const router = useRouter();

  return (
    <ColumnsAlbum
      data={data}
      isCollection={isCollection}
      openSlideshow={openSlideshow}
      onClick={({ event, file }) => {
        // let a link open in a new tab / new window / download
        if (event.shiftKey || event.altKey || event.metaKey) return;

        if (file.isInList === 0) {
          router.push(`/contents/${file.id}`);
        } else {
          router.push(`/collection/${file.listId}`);
        }

        event.preventDefault();
      }}
    />
  );
};
export default RenderAlbum;
