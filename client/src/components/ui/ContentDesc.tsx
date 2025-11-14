import { useState } from "react";

interface Props {
  description: string;
}

export default function ContentDesc({ description }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLongDescription = description.length > 300; // 300자 이상이면 overflow 처리
  const truncatedDescription = isLongDescription
    ? description.substring(0, 300) + "..."
    : description;

  return (
    <div className="space-y-3">
      <p className="text-base text-gray-600 whitespace-pre-line">
        {isExpanded ? description : truncatedDescription}
        {!isExpanded && description.length > 300 && (
          <button
            onClick={() => setIsExpanded(true)}
            className="ml-2 font-semibold text-blue-500 hover:text-blue-700"
          >
            ...more
          </button>
        )}
      </p>
    </div>
  );
}
