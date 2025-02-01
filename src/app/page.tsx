/**
 * This is the default page for the root route.
 * The file page.tsx in the src/app directory corresponds to the / route in your application.
 * To create a new route, simply create a new folder with a page.tsx file inside.
 */

"use client"
import React from "react";
import { useState, useEffect } from "react";


const Page = () => {
  const [media, setMedia] = useState([]); // Array to hold photo/video data
  const [page, setPage] = useState(1); // Page number for infinite scroll

    // Fetch media items
    const fetchMedia = async (pageNum) => {
      try {
        const response = await fetch(`/api/media?page=${pageNum}`);
        const data = await response.json();
        setMedia((prev) => [...prev, ...data]); // Append new items
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
  
    <div className="min-h-screen bg-gray-100">
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow overflow-hidden relative"
            >
              {item.type === "video" ? (
                <video
                  src={item.url}
                  controls
                  className="w-full h-auto object-cover"
                />
              ) : (
                <img
                  src={item.url}
                  alt={item.alt || "media"}
                  className="w-full h-auto object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Page;