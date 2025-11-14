// components/DropZone.tsx
"use client";

import { useState, useCallback, DragEvent, ChangeEvent, useId } from "react";

interface DropZoneRenderProps {
  isDragging: boolean;
  rootProps: {
    onDragOver: (e: DragEvent) => void;
    onDragLeave: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
  };
  inputProps: {
    id: string;
    multiple: boolean;
    accept: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  };
}

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  videoUploaded: boolean;
  clearAll: () => void;
  currentCount: number;
  children: (props: DropZoneRenderProps) => React.ReactNode;
}

export default function DropZone({
  onFilesSelected,
  videoUploaded,
  clearAll,
  currentCount,
  children,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputId = useId();

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      onFilesSelected(files);
    },
    [onFilesSelected]
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      onFilesSelected(files);
    },
    [onFilesSelected]
  );

  return (
    <>
      {children({
        isDragging,
        rootProps: { onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop },
        inputProps: {
          id: inputId,
          multiple: !videoUploaded,
          accept: "image/*,video/*",
          onChange: handleFileChange,
        },
      })}
    </>
  );
}
