import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from './entities/collection.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { User } from 'src/users/entities/user.entity';
import { CollectionResponseDto } from './dto/collection-response.dto';
import { CollectionListResponseDto } from './dto/collection-list-response.dto';
import { MediaItemResponseDto } from 'src/media-items/dto/media-item-response.dto';
import { CollectionContentsResponseDto } from './dto/collection-contents-response.dto';
import { ContentStatus } from 'src/common/enums';
import { RawMediaItemResult } from 'src/media-items/media-items.service';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { Album } from 'src/albums/entities/album.entity';
import { GetCollectionContentsDto } from './dto/get-collection-contents.dto';

type RawCollection = {
  collection_id: string;
  collection_name: string;
  collection_created_at: Date;
  totalCount: string;
  thumbnailKey?: string;
  mediaThumbnailKey?: string;
  albumThumbnailKey?: string;

  mediaCreatedAt: Date;
  albumCreatedAt: Date;

  mediaAddedAt: Date;
  albumAddedAt: Date;
};

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private collectionRepository: Repository<Collection>,
    @InjectRepository(MediaItem)
    private mediaItemRepository: Repository<MediaItem>,
    @InjectRepository(Album)
    private albumRepository: Repository<Album>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 사용자별 컬렉션 기본정보 조회
  async findUserCollections(
    userId: number,
  ): Promise<{ message: string; collections: CollectionListResponseDto[] }> {
    const rawCollections: RawCollection[] = await this.collectionRepository
      .createQueryBuilder('collection')
      .where('collection.userId = :userId', { userId })
      .leftJoin('collection.mediaItems', 'media')
      .select(['collection.id', 'collection.name', 'collection.createdAt'])
      .addSelect(`(COUNT(DISTINCT media.id))`, 'totalCount')

      // 미디어 small 이미지 키 추출(썸네일용)
      .addSelect(
        (subQuery) =>
          subQuery
            .select('m.keyImageSmall')
            .from('collection_media_items', 'cmi')
            .innerJoin(MediaItem, 'm', 'm.id = cmi.media_id')
            .where('cmi.collection_id = collection.id')
            .orderBy('cmi.created_at', 'DESC')
            .limit(1),
        'thumbnailKey',
      )
      // 미디어가 컬렉션에 추가된 날짜 추출(정렬용)
      .addSelect(
        (subQuery) =>
          subQuery
            .select('cmi.created_at')
            .from('collection_media_items', 'cmi')
            .where('cmi.collection_id = collection.id')
            .orderBy('cmi.created_at', 'DESC')
            .limit(1),
        'mediaAddedAt',
      )

      .groupBy('collection.id')
      .orderBy('collection.createdAt', 'ASC')
      .getRawMany();

    const collections: CollectionListResponseDto[] = rawCollections.map(
      (raw) => {
        return {
          id: parseInt(raw.collection_id, 10),
          name: raw.collection_name,

          itemCount: parseInt(raw.totalCount) || 0,
          thumbnailKey: raw.thumbnailKey || null,
        };
      },
    );

    return { message: '컬렉션 목록 조회 성공', collections };
  }

  // 특정 컬렉션의 콘텐츠들을 조회
  async getCollectionContents(
    query: GetCollectionContentsDto,

    currentUserId?: number,
  ): Promise<{
    message: string;
    contents: CollectionContentsResponseDto;
  }> {
    const { page, collectionId } = query;

    const collection = await this.collectionRepository.findOne({
      where: { id: collectionId, userId: currentUserId },
      select: ['id', 'name', 'userId'],
    });

    if (!collection) {
      throw new NotFoundException(
        '컬렉션을 찾을 수 없거나 접근 권한이 없습니다.',
      );
    }
    const limit = 40;
    const offset = (page - 1) * limit;

    // 컬렉션에 포함된 미디어 아이템 조회 (미디어 피드와 유사한 상세 정보 포함)
    const qb = this.mediaItemRepository
      .createQueryBuilder('media')
      .innerJoin('collection_media_items', 'cmi', 'cmi.media_id = media.id')
      .where('cmi.collection_id = :collectionId', { collectionId })
      .andWhere('media.status = :status', { status: ContentStatus.ACTIVE })

      // JOIN 및 통계/좋아요 계산
      .leftJoin('media.owner', 'user')
      .leftJoin('media.likedByUsers', 'likes')
      .leftJoin('media.album', 'album')

      .select([
        'media.id',
        'media.title',
        'media.type',
        'media.width',
        'media.height',
        'media.keyImageSmall',
        'media.keyVideoPreview',
        'media.keyImageLarge',
        'media.keyImageMedium',
        'media.keyVideoPlayback',
        'media.createdAt',
        'user.nickname',
        'user.profileImageKey',
        'album.id',
        'cmi.created_at',
      ])
      .addSelect('COUNT(likes.id)', 'likeCount')
      .addSelect(
        currentUserId
          ? `(SELECT 1 FROM user_media_likes WHERE user_media_likes.user_id = ${currentUserId} AND user_media_likes.media_id = media.id) IS NOT NULL`
          : `FALSE`,
        'isLiked',
      )
      .groupBy(
        'media.id, user.id, user.nickname, user.profileImageKey, media.createdAt, album.id, cmi.created_at',
      )
      .orderBy('cmi.created_at', 'DESC');

    qb.offset(offset).limit(limit);

    const total = await qb.getCount();
    const rawItems: RawMediaItemResult[] = await qb.getRawMany();

    const items: MediaItemResponseDto[] = rawItems.map((rawItem) => ({
      id: rawItem.media_id,
      title: rawItem.media_title,
      type: rawItem.media_type,
      width: rawItem.media_width,
      height: rawItem.media_height,
      keyImageSmall: rawItem.media_key_image_small,
      keyImageMedium: rawItem.media_key_image_medium,
      keyImageLarge: rawItem.media_key_image_large,
      keyVideoPreview: rawItem.media_key_video_preview,
      keyVideoPlayback: rawItem.media_key_video_playback,
      isLikedByCurrentUser: rawItem.isLiked == 1,
      albumId: rawItem.album_id || null,
    }));

    const contents = {
      id: collection.id,
      name: collection.name,
      userId: collection.userId,
      totalItems: total,
      items: items,
    };
    return { message: '컬렉션 내 콘텐츠 조회 성공', contents };
  }

  // 새 컬렉션 생성
  async createCollection(
    userId: number,
    dto: CreateCollectionDto,
  ): Promise<{ message: string; collection: CollectionResponseDto }> {
    const { name, mediaId } = dto;
    // 컬렉션 이름 중복 확인 (사용자당 이름은 고유해야 함)
    const existingCollection = await this.collectionRepository.findOne({
      where: { owner: { id: userId }, name },
    });

    if (existingCollection) {
      throw new ConflictException(`이미 ${name} 이름의 컬렉션이 존재합니다.`);
    }

    const newCollection = this.collectionRepository.create({
      userId,
      name,
    });

    const savedCollection = await this.collectionRepository.save(newCollection);

    const collection = {
      id: savedCollection.id,
      name: savedCollection.name,
      itemCount: 0,
      userId: savedCollection.userId,
    };

    // 콘텐츠 id 값과 타입이 있을 때 자동으로 새로 생성된 컬렉션에 추가
    if (mediaId) {
      await this.toggleMediaItem(savedCollection.id, mediaId, userId);
    }

    return {
      message: '새 컬렉션이 생성되었습니다.',
      collection,
    };
  }

  // 컬렉션 이름 수정
  async updateCollection(
    collectionId: number,
    userId: number,
    dto: UpdateCollectionDto,
  ): Promise<{ message: string; collection: CollectionResponseDto }> {
    const { name } = dto;

    // 컬렉션 및 소유권 확인
    const collection = await this.collectionRepository.findOne({
      where: { id: collectionId, userId: userId },
    });

    if (!collection) {
      throw new NotFoundException(
        '컬렉션을 찾을 수 없거나 수정 권한이 없습니다.',
      );
    }

    // 이름 변경 시 중복 확인
    if (name && name !== collection.name) {
      const existingCollection = await this.collectionRepository.findOne({
        where: { userId: userId, name },
      });
      if (existingCollection) {
        throw new ConflictException(
          `이미 [${name}] 이름의 컬렉션이 존재합니다.`,
        );
      }
    }

    // 데이터 업데이트 및 저장
    collection.name = name || collection.name; // 이름 업데이트
    const updatedCollection = await this.collectionRepository.save(collection);

    const collectionToReturn = {
      id: updatedCollection.id,
      name: updatedCollection.name,
      itemCount: 0,
      userId: updatedCollection.userId,
    };

    return {
      message: '컬렉션 이름이 수정되었습니다.',
      collection: collectionToReturn,
    };
  }

  // 컬렉션 삭제
  async deleteCollection(
    collectionId: number,
    userId: number,
  ): Promise<{ message: string }> {
    const result = await this.collectionRepository.softDelete({
      id: collectionId,
      userId: userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        '컬렉션을 찾을 수 없거나 삭제 권한이 없습니다.',
      );
    }

    return {
      message: '컬렉션이 삭제되었습니다.',
    };
  }

  // 미디어를 특정 컬렉션에 추가/제거
  async toggleMediaItem(
    collectionId: number,
    mediaId: number,
    currentUserId: number,
  ): Promise<{ message: string; isAdded: boolean }> {
    const collection = await this.collectionRepository.findOne({
      where: { id: collectionId },
      relations: ['mediaItems'],
    });

    const mediaItem = await this.mediaItemRepository.findOne({
      where: { id: mediaId },
    });

    if (!collection || !mediaItem) {
      throw new NotFoundException(
        '컬렉션 또는 미디어 아이템을 찾을 수 없습니다.',
      );
    }

    if (collection.userId !== currentUserId) {
      throw new UnauthorizedException(
        '이 컬렉션에 미디어를 추가할 권한이 없습니다.',
      );
    }

    // 현재 상태 확인 및 토글
    const isCurrentlyInCollection = collection.mediaItems.some(
      (item) => item.id === mediaId,
    );

    if (isCurrentlyInCollection) {
      // 제거 (Dislike)
      collection.mediaItems = collection.mediaItems.filter(
        (item) => item.id !== mediaId,
      );
      await this.collectionRepository.save(collection);

      return {
        message: '해당 콘텐츠가 컬렉션에서 제거되었습니다.',
        isAdded: false,
      };
    } else {
      // 추가
      collection.mediaItems.push(mediaItem);
      await this.collectionRepository.save(collection);

      return {
        message: '해당 콘텐츠가 컬렉션에 추가되었습니다.',
        isAdded: true,
      };
    }
  }
}
