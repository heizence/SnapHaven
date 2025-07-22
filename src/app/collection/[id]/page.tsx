"use client";

import RenderAlbum from "@/components/RenderAlbum";
import Slideshow from "@/components/Slideshow";
import { GetCollectionAPI } from "@/lib/APIs";
import { EachContent, GetCollectionRequest } from "@/lib/interfaces";
import { renderContentsCb } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

interface PageProps {
  params: { id: string }; // The dynamic route parameter
}

const Page = ({ params }: PageProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1); // Page number for infinite scroll
  const [data, setData] = useState<Array<EachContent>>([]); // Array to hold photo/video data
  const [isLastPage, setIsLastPage] = useState<boolean>(false);
  const [slideshowState, setSlideshowState] = useState({ isOpen: false, startIndex: 0 });

  const throttleTimeout = useRef<NodeJS.Timeout | null>(null);

  const getData = async (isRefresh = false) => {
    try {
      setIsLoading(true);
      const { id } = await params;
      const reqParams: GetCollectionRequest = {
        id,
        page: isRefresh ? 1 : page,
      };

      const res = await GetCollectionAPI(reqParams);
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

  const openSlideshow = (index) => {
    setSlideshowState({ isOpen: true, startIndex: index });
  };

  const closeSlideshow = () => {
    setSlideshowState({ isOpen: false, startIndex: 0 });
  };

  useEffect(() => {
    if (!isLastPage) {
      getData();
    }
  }, [page]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div>
      {data && (
        <>
          <RenderAlbum data={data} isCollection={true} openSlideshow={openSlideshow} />
          {slideshowState.isOpen && (
            <Slideshow
              images={data}
              startIndex={slideshowState.startIndex}
              onClose={closeSlideshow}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Page;
