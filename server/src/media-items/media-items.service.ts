import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaItem } from './entities/media-item.entity';
import { GetMediaItemsDto, MediaSort } from './dto/get-media-items.dto';
import { ContentStatus, ContentType } from 'src/common/enums';
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

    const { page, sort, type } = query;
    const offset = (page - 1) * limit;
    console.log('[media-items.service.ts]findAll');
    console.log('[media-items.service.ts]page, limit, sort, type');
    // QueryBuilder를 사용하여 복합 조건 적용
    const qb = this.mediaRepository
      .createQueryBuilder('media')
      .where('media.status = :status', { status: ContentStatus.ACTIVE })
      .andWhere(type !== 'ALL' ? 'media.type = :type' : '1=1', { type })
      .leftJoin('media.owner', 'user')
      .leftJoin('media.likedByUsers', 'likes')
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
      ])
      .addSelect('COUNT(likes.id)', 'likeCount')
      .groupBy('media.id, user.id, user.nickname');

    // 정렬 적용
    if (sort === MediaSort.LATEST) {
      qb.orderBy({
        'media.createdAt': 'DESC',
        'media.id': 'DESC', // 안정 정렬
      });
    } else if (sort === MediaSort.POPULAR) {
      qb.orderBy({
        likeCount: 'DESC',
        'media.createdAt': 'DESC',
        'media.id': 'DESC',
      });
      // 추후 수정
    }

    // 페이지네이션 적용
    const [items, total] = await qb.skip(offset).take(limit).getManyAndCount(); // getManyAndCount로 아이템과 전체 개수를 동시에 가져온다.

    // DTO로 데이터 변환
    const mappedItems: MediaItemResponseDto[] = items.map((item) => ({
      id: item.id,
      title: item.title,
      keyImageSmall: item.keyImageSmall!,
      keyImageMedium: item.keyImageMedium,
      keyImageLarge: item.keyImageLarge,
      keyVideoPreview: item.keyVideoPreview,
      type: item.type,
      width: item.width,
      height: item.height,
    }));

    return {
      items: mappedItems,
      total,
    };
  }
}
