"use client";

import RenderSingleContent from "@/components/RenderSIngleContent";
import { GetEachContentAPI } from "@/lib/APIs";
import { EachContent, GetEachContentRequest } from "@/lib/interfaces";
import { renderContentsCb } from "@/lib/utils";
import { useEffect, useState } from "react";

interface PageProps {
  params: { id: string }; // The dynamic route parameter
}

const Page = ({ params }: PageProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<EachContent>(null); // Array to hold photo/video data

  const getData = async () => {
    console.log("#getData");

    try {
      setIsLoading(true);
      const { id } = await params;
      const req: GetEachContentRequest = {
        id,
      };

      const res = await GetEachContentAPI(req);
      console.log("res : ", res);

      if (res?.success) {
        const content = res.data.map((file: EachContent) => renderContentsCb(file));

        setData(content[0]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch media:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div className="relative flex justify-center w-full h-[calc(80vh-150px)] mt-10 mb-10">
      {data && (
        <>
          <RenderSingleContent file={data} />
        </>
      )}
    </div>
  );
};

export default Page;
