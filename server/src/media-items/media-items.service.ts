import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { MediaItem } from './entities/media-item.entity';
import { GetMediaItemsDto, MediaSort } from './dto/get-media-items.dto';
import { ContentStatus } from 'src/common/enums';
import {
  PaginatedMediaItemsDto,
  MediaItemResponseDto,
} from './dto/media-item-response.dto';

@Injectable()
export class MediaItemsService {
  constructor(
    @InjectRepository(MediaItem)
    private mediaRepository: Repository<MediaItem>,
  ) {}

  /**
   * 메인 피드 콘텐츠를 페이지네이션 및 필터링하여 조회
   */
  async findAll(query: GetMediaItemsDto): Promise<PaginatedMediaItemsDto> {
    const limit = 40;
    const { page, sort, type, keyword } = query;
    const offset = (page - 1) * limit;

    const qb = this.mediaRepository
      .createQueryBuilder('media')
      .where('media.status = :status', { status: ContentStatus.ACTIVE })
      // [앨범 대표 항목 필터링] 단일 콘텐츠이거나 (albumId IS NULL), 혹은 앨범 내에서 ID가 가장 작은 레코드만 선택한다.
      .andWhere(
        new Brackets((sqb) => {
          sqb
            .where('media.albumId IS NULL')
            .orWhere(
              'media.id = (' +
                'SELECT MIN(t1.id) FROM media_items t1 ' +
                'WHERE t1.album_id = media.album_id AND t1.status = :activeStatus' +
                ')',
              { activeStatus: ContentStatus.ACTIVE },
            );
        }),
      )
      // 타입 필터링
      .andWhere(type !== 'ALL' ? 'media.type = :type' : '1=1', { type });

    // 3. [키워드 필터링] 제목 또는 설명에 키워드가 포함된 경우
    if (keyword) {
      const searchPattern = `%${keyword}%`;
      qb.andWhere(
        new Brackets((where) => {
          where
            .where('media.title LIKE :searchPattern', { searchPattern })
            .orWhere('media.description LIKE :searchPattern', {
              searchPattern,
            });
        }),
      );
    }

    qb.leftJoin('media.owner', 'user')
      .leftJoin('media.likedByUsers', 'likes')
      .leftJoin('media.album', 'album') // ⭐ album join 추가
      .select([
        'media.id',
        'media.title',
        'media.type',
        'media.width',
        'media.height',
        'media.keyImageSmall',
        'media.keyImageMedium',
        'media.keyImageLarge',
        'media.keyVideoPreview',
        'media.createdAt',
        'user.nickname',
        'album.id', // ⭐ albumId 조회
      ])
      .addSelect('COUNT(likes.id)', 'likeCount')
      .groupBy('media.id, user.id, user.nickname, media.createdAt');

    // 정렬
    if (sort === MediaSort.LATEST) {
      qb.orderBy('media.createdAt', 'DESC');
    } else if (sort === MediaSort.POPULAR) {
      qb.orderBy('likeCount', 'DESC');
    }

    const [items, total] = await qb.skip(offset).take(limit).getManyAndCount();

    const mappedItems: MediaItemResponseDto[] = items.map((rawItem) => ({
      id: rawItem.id,
      title: rawItem.title,
      keyImageSmall: rawItem.keyImageSmall,
      keyImageMedium: rawItem.keyImageMedium,
      keyImageLarge: rawItem.keyImageLarge,
      keyVideoPreview: rawItem.keyVideoPreview,
      //ownerNickname: rawItem.owner.nickname,
      //likeCount: parseInt(rawItem., 10) || 0,

      type: rawItem.type,
      width: rawItem.width,
      height: rawItem.height,
      albumId: rawItem.album?.id || null,
    }));

    return {
      items: mappedItems,
      total,
    };
  }
}
