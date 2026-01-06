import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { S3UtilityService } from 'src/media-pipeline/s3-utility.service';

import { Repository, In, Brackets } from 'typeorm';
import { DeleteItemDto } from './dto/bulk-delete.dto';
import { Album } from 'src/albums/entities/album.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(MediaItem)
    private mediaRepository: Repository<MediaItem>,
    @InjectRepository(Album)
    private albumRepository: Repository<Album>,
    private s3UtilityService: S3UtilityService,
  ) {}

  async findAllWithDeleted(page: number = 1) {
    const limit = 40;
    const offset = (page - 1) * limit;

    const qb = this.mediaRepository
      .createQueryBuilder('media')
      .withDeleted()
      .leftJoin('media.owner', 'user')
      .leftJoin('media.album', 'album')
      .leftJoin('media.likedByUsers', 'likes')
      .leftJoin('media.tags', 'tag')
      .andWhere(
        new Brackets((subQb) => {
          subQb
            .where('media.albumId IS NULL') // 단일 콘텐츠거나
            .orWhere('media.isRepresentative = 1'); // 앨범 내 대표 이미지인 경우
        }),
      );

    qb.select([
      'media.id',
      'media.title',
      'media.type',
      'media.width',
      'media.height',
      'media.keyImageSmall',
      'media.keyImageMedium',
      'media.keyImageLarge',
      'media.keyVideoPreview',
      'media.keyVideoPlayback',
      'media.isRepresentative',
      'media.status',
      'media.createdAt',
      'media.deletedAt',
      'user.email',
      'user.nickname',
      'album.id',
      'album.status',
    ])
      .groupBy('media.id')
      .addGroupBy('user.id')
      .addGroupBy('album.id');

    qb.orderBy('media.id', 'DESC');
    qb.offset(offset).limit(limit);

    const rawItems: any[] = await qb.getRawMany();

    const mappedItems = rawItems.map((rawItem) => ({
      id: rawItem.media_id,
      title: rawItem.media_title,
      type: rawItem.media_type,
      status: rawItem.media_status,
      width: rawItem.media_width,
      height: rawItem.media_height,
      keyImageSmall: rawItem.media_key_image_small,
      keyImageMedium: rawItem.media_key_image_medium,
      keyImageLarge: rawItem.media_key_image_large,
      createdAt: rawItem.media_created_at,
      deletedAt: rawItem.media_deleted_at, // 삭제된 시간 (null이면 정상)
      albumId: rawItem.album_id || undefined,
      albumStatus: rawItem.album_status || undefined, // 앨범의 상태(ACTIVE, INACTIVE 등)
      uploaderEmail: rawItem.user_email,
      uploaderNickname: rawItem.user_nickname,
    }));

    return {
      message: '전체 콘텐츠(상태 무관) 불러오기 성공',
      items: mappedItems,
      currentPage: page,
      hasMore: rawItems.length >= limit,
    };
  }
  // 벌크 삭제 로직은 이전과 동일하게 유지
  async bulkHardDelete(items: DeleteItemDto[]) {
    const albumIds = items.filter((i) => i.isAlbum).map((i) => i.id);
    const mediaIds = items.filter((i) => !i.isAlbum).map((i) => i.id);

    // 삭제할 모든 MediaItem 수집
    const allTargets = await this.mediaRepository.find({
      where: [{ id: In(mediaIds) }, { albumId: In(albumIds) }],
      withDeleted: true,
    });

    if (allTargets.length === 0 && albumIds.length === 0) {
      throw new NotFoundException('삭제할 대상을 찾을 수 없습니다.');
    }

    // S3 키 수집 (이미지 및 영상 모든 사이즈)
    const keysToDelete: string[] = [];
    allTargets.forEach((item) => {
      const keys = [
        item.keyImageSmall,
        item.keyImageMedium,
        item.keyImageLarge,
        item.keyVideoPreview,
        item.keyVideoPlayback,
        item.s3KeyOriginal,
      ];
      keys.forEach((k) => {
        if (k) keysToDelete.push(k);
      });
    });

    try {
      // S3 파일 일괄 삭제
      if (keysToDelete.length > 0) {
        await this.s3UtilityService.deleteObjects('originals', keysToDelete);
        await this.s3UtilityService.deleteObjects('assets', keysToDelete);
      }

      // MediaItems 삭제
      if (allTargets.length > 0) {
        await this.mediaRepository.delete({
          id: In(allTargets.map((t) => t.id)),
        });
      }

      // 앨범 자체 삭제
      if (albumIds.length > 0) {
        await this.albumRepository.delete({
          id: In(albumIds),
        });
      }

      return {
        success: true,
        count: {
          albums: albumIds.length,
          mediaItems: allTargets.length,
        },
      };
    } catch (error) {
      console.error('영구 삭제 중 오류:', error);
      throw new InternalServerErrorException(
        '삭제 처리 중 오류가 발생했습니다.',
      );
    }
  }
}
