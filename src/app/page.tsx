/**
 * This is the default page for the root route.
 * The file page.tsx in the src/app directory corresponds to the / route in your application.
 * To create a new route, simply create a new folder with a page.tsx file inside.
 */
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { getContentsAPI } from "@/lib/APIs";
import { EachContent, GetContentsRequest } from "@/lib/interfaces";
import RenderAlbum from "@/components/RenderAlbum";
import { renderContentsCb } from "@/lib/utils";

const Page = () => {
  const [data, setData] = useState<Array<EachContent>>([]); // Array to hold photo/video data
  const [page, setPage] = useState<number>(1); // Page number for infinite scroll
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLastPage, setIsLastPage] = useState<boolean>(false);
  const [type, setType] = useState<"all" | "image" | "video">("all");

  const throttleTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch media items
  const getData = async (isRefresh = false) => {
    console.log("#getData");

    try {
      setIsLoading(true);
      const params: GetContentsRequest = {
        type,
        page: isRefresh ? 1 : page,
        keyword: "",
      };

      const res = await getContentsAPI(params);
      console.log("res : ", res);

      if (res?.success) {
        const contents = res.data.map((file: EachContent) => renderContentsCb(file));

        if (isRefresh) {
          setData(contents);
          setPage(1);
        } else {
          setData((prev) => [...prev, ...contents]); // Append new items
        }

        if (res.data.length < 20) {
          setIsLastPage(true);
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch media:", error);
      setIsLoading(false);
    }
  };

  // The handleScroll function is now wrapped in throttling logic.
  const handleScroll = useCallback(() => {
    // If a throttle timer is already running, do nothing.
    if (throttleTimeout.current) {
      return;
    }

    // If there's no active timer, set one.
    throttleTimeout.current = setTimeout(() => {
      // The actual logic runs inside the timeout callback.
      if (isLastPage || isLoading) {
        // Clear the timer and exit if we shouldn't fetch.
        throttleTimeout.current = null;
        return;
      }

      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 10
      ) {
        console.log("Threshold reached, fetching next page...");
        setPage((prev) => prev + 1);
      }

      // Clear the ref so a new timer can be set on the next scroll event.
      throttleTimeout.current = null;
    }, 500); // Throttle interval: 200 milliseconds
  }, [isLastPage, isLoading]); // Dependencies are still needed for the logic inside the timeout.

  useEffect(() => {
    if (!isLastPage) {
      getData();
    }
  }, [page]);

  useEffect(() => {
    getData(true);
  }, [type]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div>
      <div>
        <div className="mt-5 mb-5">
          <Button
            className="contents-type-btn"
            id={type === "all" ? "contents-type-btn-selected" : ""}
            onClick={() => {
              setType("all");
            }}
          >
            <span>All</span>
          </Button>
          <Button
            className="contents-type-btn"
            id={type === "image" ? "contents-type-btn-selected" : ""}
            onClick={() => {
              setType("image");
            }}
          >
            <span>Pictures</span>
          </Button>
          <Button
            className="contents-type-btn"
            id={type === "video" ? "contents-type-btn-selected" : ""}
            onClick={() => {
              setType("video");
            }}
          >
            <span>Video</span>
          </Button>
        </div>

        <RenderAlbum data={data} />
      </div>
    </div>
  );
};

export default Page;
