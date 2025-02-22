"use client";

import { useEffect, useState } from "react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import photos from "../app/photos";
import StyledLink from "./StyledLink";

export default function PhotoRenderer({ id }: { id: string }) {
  const [images, setImages] = useState<string[]>([]);

  const getData = () => {
    let test = `https://assets.react-photo-album.com/_next/image?url=${encodeURIComponent(
      "/_next/static/media/image01.018d1d35.jpg"
    )}&w=1080&q=75`;
    setImages([test, test, test, test, test, test, test, test]);
  };

  useEffect(() => {
    if (!id) return;
    //getData();
  }, [id]);

  return (
    <div className="w-full flex justify-center">
      <RowsPhotoAlbum
        photos={photos.slice(0)}
        render={{
          link: (props) => <StyledLink {...props} />,
        }}
        defaultContainerWidth={1200}
        onClick={({ event, photo }) => {
          // let a link open in a new tab / new window / download
          if (event.shiftKey || event.altKey || event.metaKey) return;
          // prevent the default link behavior

          event.preventDefault();
        }}
      />
    </div>
  );
}
