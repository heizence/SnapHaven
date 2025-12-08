import { HttpStatus } from '@nestjs/common';
import {
  PaginatedMediaItemsDto,
  MediaItemResponseDto,
} from '../dto/media-item-response.dto';
import { MediaItemDetailDto } from '../dto/media-item-detail.dto';

const mediaItemFeedExample: MediaItemResponseDto = {
  id: 1494,
  title: '파리 에펠탑의 새벽',
  type: 'IMAGE',
  keyImageSmall: 'media-items/1234_1234567890123/small.jpg',
  keyImageMedium: 'media-items/1234_1234567890123/medium.jpg',
  keyImageLarge: 'media-items/1234_1234567890123/large.jpg',
  keyVideoPreview: null,
  width: 1920,
  height: 1080,
  albumId: 1,
};

export const PaginatedMediaItemsExample: PaginatedMediaItemsDto = {
  items: [
    mediaItemFeedExample,
    { ...mediaItemFeedExample, id: 1495, title: '런던 야경' },
  ],
  totalCounts: 1500,
};

export const MediaItemDetailExample: MediaItemDetailDto = {
  id: 1494,
  title: '파리 에펠탑의 새벽',
  description: '2025년 5월에 촬영된 에펠탑 사진입니다. 새벽 5시에 담았습니다.',
  type: 'IMAGE',
  width: 1920,
  height: 1080,
  keyImageSmall: 'media-items/1234_1234567890123/small.jpg',
  keyImageMedium: 'media-items/1234_1234567890123/medium.jpg',
  keyImageLarge: 'media-items/1234_1234567890123/large.jpg',
  keyVideoPlayback: null,
  likeCount: 89,
  downloadCount: 12,
  ownerNickname: 'PhotoMaster',
  ownerProfileImageKey: 'user/profile/master_2025.jpg',
  createdAt: '2025-11-20T10:00:00.000Z',
  tags: ['여행', '파리', '새벽'],
  isLikedByCurrentUser: true,
};

export const MediaNotFoundResponse = {
  status: HttpStatus.NOT_FOUND,
  description: '콘텐츠를 찾을 수 없거나 삭제되었습니다.',
  schema: {
    example: {
      code: HttpStatus.NOT_FOUND,
      message: '요청하신 콘텐츠를 찾을 수 없습니다.',
      data: null,
    },
  },
};
