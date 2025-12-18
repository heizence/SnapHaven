import { AWS_BASE_URL } from "@/constants";
import { User } from "lucide-react";
import Image from "next/image";

interface Props {
  name: string;
  profileImageKey?: string | null;
  uploadedDate: string; // 콘텐츠를 업로드한 날짜(yyyy.mm.dd)
}

export default function UserInfoArea({ name, profileImageKey, uploadedDate }: Props) {
  return (
    <div className="flex flex-shrink-0 items-center justify-between">
      <div className="flex items-center gap-3">
        {profileImageKey ? (
          <Image
            src={AWS_BASE_URL + profileImageKey}
            alt={name}
            width={40}
            height={40}
            className="rounded-full w-12 h-12 bg-red"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            <User size={24} className="text-gray-500" />
          </div>
        )}
        <div>
          <p className="text-base font-bold text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">{uploadedDate}</p>
        </div>
      </div>
    </div>
  );
}
