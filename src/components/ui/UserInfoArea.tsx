import Image from "next/image";

interface Props {
  name: string;
  avatarUrl: string;
  uploadedDate: string; // 콘텐츠를 업로드한 날짜(yyyy.mm.dd)
}

export default function UserInfoArea({ name, avatarUrl, uploadedDate }: Props) {
  return (
    <div className="flex flex-shrink-0 items-center justify-between">
      <div className="flex items-center gap-3">
        <Image
          src={avatarUrl}
          alt={name}
          width={40}
          height={40}
          className="rounded-full w-12 h-12"
        />
        <div>
          <p className="text-base font-bold text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">{uploadedDate}</p>
        </div>
      </div>
    </div>
  );
}
