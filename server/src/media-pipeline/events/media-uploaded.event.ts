import { ContentType } from 'src/common/enums';

export interface MediaUploadedEvent {
  mediaId: number;
  albumId?: number;
  s3Key: string;
  mimeType: string;
  contentType: ContentType;
}
