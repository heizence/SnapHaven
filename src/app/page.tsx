/**
 * This is the default page for the root route.
 * The file page.tsx in the src/app directory corresponds to the / route in your application.
 * To create a new route, simply create a new folder with a page.tsx file inside.
 */

"use client";
import React from "react";
import { useState, useEffect } from "react";
import { ColumnsPhotoAlbum } from "react-photo-album";

import "react-photo-album/columns.css";
import { Button } from "@/components/ui/button";
import photos from "./photos";
import { StyledLink } from "../components";

const Page = () => {
  const [data, setData] = useState([]); // Array to hold photo/video data
  const [page, setPage] = useState<number>(1); // Page number for infinite scroll
  const [type, setType] = useState<number>(0); // 0 : All, 1 : Pictures, 2: Videos

  // Fetch media items
  const fetchMedia = async (pageNum: number) => {
    try {
      //const response = await fetch(`/api/media?page=${pageNum}`);
      //const data = await response.json();
      //setData((prev) => [...prev, ...data]); // Append new items
    } catch (error) {
      console.error("Failed to fetch media:", error);
    }
  };

  // Handle infinite scroll
  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 100
    ) {
      setPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    fetchMedia(page);
  }, [page]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* <h1 className="text-4xl font-bold text-center mb-6">무료 스톡 사진</h1> */}
      <div>
        <div className="mt-5 mb-5">
          <Button
            className="contents-type-btn"
            id={type === 0 ? "contents-type-btn-selected" : ""}
            onClick={() => {
              setType(0);
            }}
          >
            <span>All</span>
          </Button>
          <Button
            className="contents-type-btn"
            id={type === 1 ? "contents-type-btn-selected" : ""}
            onClick={() => {
              setType(1);
            }}
          >
            <span>Pictures</span>
          </Button>
          <Button
            className="contents-type-btn"
            id={type === 2 ? "contents-type-btn-selected" : ""}
            onClick={() => {
              setType(2);
            }}
          >
            <span>Video</span>
          </Button>
        </div>

        <ColumnsPhotoAlbum
          photos={photos}
          render={{
            link: (props) => <StyledLink {...props} testProp={"testTxt"} />,
          }}
          defaultContainerWidth={1200}
          columns={(containerWidth) => {
            if (containerWidth < 400) return 1;
            if (containerWidth < 800) return 2;
            if (containerWidth < 1200) return 3;
            return 4;
          }}
          // sizes={{
          //   size: "1168px",
          //   sizes: [{ viewport: "(max-width: 1200px)", size: "calc(100vw - 32px)" }],
          // }}

          onClick={({ event, photo }) => {
            // let a link open in a new tab / new window / download
            if (event.shiftKey || event.altKey || event.metaKey) return;
            // prevent the default link behavior
            event.preventDefault();
          }}
        />
      </div>
    </div>
  );
};

export default Page;
