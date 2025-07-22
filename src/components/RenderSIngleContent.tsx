"use client";

import { EachContent } from "@/lib/interfaces";
import Image from "next/image";

export default function RenderSingleContent({ file }: { file: EachContent }) {
  return (
    <Image
      src={file.src}
      alt={file.name}
      width={file.width}
      height={file.height}
      className="object-contain"
      priority
    />
  );
}
