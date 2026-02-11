import { ContentStatus, ContentType } from "@/constants/enums";

// react-photo-album/masonry 라이브러리에 전달해 줄 데이터
export interface Photo {
  key: string;
  type: ContentType.IMAGE | ContentType.VIDEO;
  title: string;
  albumId: number | null;
  isLikedByCurrentUser: boolean;
  likeCount: number;

  width: number;
  height: number;
  status?: ContentStatus;

  keyImageLarge: string | null;
  keyImageMedium: string | null;
  keyImageSmall: string;
  keyVideoPreview: string | null;
  keyVideoPlayback: string | null;

  createdAt: string;
}
