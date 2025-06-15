"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getProfileInfoAPI } from "@/lib/APIs";
import { ProfileInfo } from "@/lib/interfaces";
import { CircleUserRound } from "lucide-react";

export default function MyProfilePage() {
  const router = useRouter();
  const tabs = ["갤러리", "컬렉션"];

  const [activeTab, setActiveTab] = useState<"갤러리" | "컬렉션">("갤러리");
  const [orderType, setOrderType] = useState<"최신순" | "이름순">("최신순");
  const [profileInfo, setProfileInfo] = useState<ProfileInfo>({ email: "", username: "" });
  const [data, setData] = useState([]);
  const [isReady, setIsReady] = useState(false); // ready to render?

  const selectTab = async (item) => {
    setActiveTab(item);
  };

  const getProfileInfo = async () => {
    try {
      const res = await getProfileInfoAPI();
      console.log("res : ", res);
      if (res.success) {
        setProfileInfo(res.data);
      } else {
        alert("에러가 발생하였습니다.");
      }

      setIsReady(true);
    } catch (error) {
      console.log(error);
      alert("에러가 발생하였습니다.");
    }
  };

  useEffect(() => {
    getProfileInfo();
  }, []);

  if (!isReady) return null;

  return (
    <div className="max-w-1xl mx-auto px-4 py-8">
      {/* Profile */}
      <div className="flex flex-col items-center text-center">
        {profileInfo.profileImgUrl ? (
          <Image
            src={profileInfo.profileImgUrl}
            alt="preview"
            width={200}
            height={200}
            priority={true}
            className="w-20 h-20 rounded-full"
            unoptimized
          />
        ) : (
          <CircleUserRound size={80} />
        )}
        <h1 className="text-2xl font-semibold mt-4">{profileInfo.username}</h1>
        <button
          className="mt-2 bg-green-500 text-white px-4 py-1.5 rounded"
          onClick={() => {
            router.push("/myprofile/edit");
          }}
        >
          프로필 수정
        </button>
      </div>

      <div className="flex justify-around text-center text-sm text-gray-600 mt-6 border-t pt-4"></div>

      {/* Navigation */}
      <div>
        <div className="flex flex-wrap justify-start gap-2 mt-6 text-sm">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => selectTab(item)}
              className={`px-4 py-2 rounded-full ${
                item === activeTab ? "bg-black text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {item}
            </button>
          ))}

          {/* Sort Dropdown Placeholder */}
          <select className="ml-5 border border-gray-300 rounded px-2 py-1 text-sm">
            <option>최신순</option>
            <option>이름순</option>
          </select>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center mt-10 border rounded py-10 px-4 text-gray-600">
          <p className="text-lg mb-2">콘텐츠가 없습니다.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {data.map((item, idx) => (
            <div key={idx} className="rounded overflow-hidden border">
              <div className="relative w-full aspect-[4/3]">
                <Image src={item.image} alt={item.title} fill className="object-cover" />
              </div>
              <div className="flex justify-between items-center text-sm text-gray-700 px-3 py-2">
                <span>{item.title}</span>
                <div className="flex items-center gap-1">
                  <Image src="/icon-image.svg" width={14} height={14} alt="icon" />
                  <span>{item.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
