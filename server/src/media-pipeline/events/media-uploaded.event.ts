import { ContentType } from 'src/common/enums';

export interface MediaUploadedEvent {
  mediaId: number;
  s3Key: string;
  mimeType: string;
  contentType: ContentType;
}
