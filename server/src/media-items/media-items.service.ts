import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { MediaItem } from './entities/media-item.entity';
import { GetMediaItemsDto, MediaSort } from './dto/get-media-items.dto';
import { ContentStatus, ContentType } from 'src/common/enums';
import { MediaItemResponseDto } from './dto/media-item-response.dto';
import { MediaItemDetailDto } from './dto/media-item-detail.dto';
import {
  AlbumDetailResponseDto,
  AlbumMediaItemDto,
} from 'src/albums/dto/album-detail.dto';
import { Album } from 'src/albums/entities/album.entity';

interface RawMediaItemDetailResult {
  media_id: number;
  media_title: string;
  media_description: string | null;
  media_type: 'IMAGE' | 'VIDEO';
  media_width: number;
  media_height: number;
  media_download_count: string;
  media_key_image_large: string | null;
  media_key_image_medium: string | null;
  media_key_image_small: string | null;
  media_key_video_playback: string | null;
  media_key_video_preview: string | null;
  media_created_at: Date;
  owner_nickname: string;
  owner_profile_image_key: string | null;

  // 계산된 필드
  likeCount: string; // SQL COUNT 결과는 문자열로 반환될 수 있음
  isLiked: number; // MAX(CASE WHEN ...) 결과
}

@Injectable()
export class MediaItemsService {
  constructor(
    @InjectRepository(MediaItem)
    private mediaRepository: Repository<MediaItem>,

    @InjectRepository(Album)
    private albumRepository: Repository<Album>,
  ) {}

  // 메인 피드 콘텐츠를 페이지네이션 및 필터링하여 조회
  async findAll(query: GetMediaItemsDto): Promise<{
    message: string;
    items: MediaItemResponseDto[];
    totalCounts: number;
  }> {
    const limit = 40;
    const { page, sort, type, keyword, tag } = query;
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
      .leftJoin('media.owner', 'user')
      .leftJoin('media.likedByUsers', 'likes')
      .leftJoin('media.tags', 'tag')
      .leftJoin('media.album', 'album')

      // 타입 필터링
      .andWhere(type !== 'ALL' ? 'media.type = :type' : '1=1', { type });

    // 태그 필터링
    if (tag) {
      qb.andWhere('tag.name = :searchTag', { searchTag: tag });
    }

    // [키워드 필터링] 제목 또는 설명에 키워드가 포함된 경우
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
      'media.createdAt',
      'user.nickname',
      'album.id',
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
      type: rawItem.type,
      width: rawItem.width,
      height: rawItem.height,
      albumId: rawItem.album?.id || null,
    }));

    return {
      message: '',
      items: mappedItems,
      totalCounts: total,
    };
  }

  // 단일 미디어 아이템 상세 정보를 조회
  async findOne(
    mediaId: number,
    currentUserId?: number,
  ): Promise<{ message: string; item: MediaItemDetailDto }> {
    // QueryBuilder를 사용하여 통계 및 소유자 정보를 한 번에 조회
    const qb = this.mediaRepository
      .createQueryBuilder('media')
      .where('media.id = :id', { id: mediaId })
      .andWhere('media.status = :status', { status: ContentStatus.ACTIVE })

      .leftJoin('media.owner', 'owner')
      .leftJoin('media.likedByUsers', 'likes')

      .select([
        'media.id',
        'media.title',
        'media.description',
        'media.type',
        'media.width',
        'media.height',
        'media.downloadCount',
        'media.keyImageLarge',
        'media.keyImageMedium',
        'media.keyImageSmall',
        'media.keyVideoPlayback',
        'media.keyVideoPreview',
        'media.createdAt',
        'owner.nickname',
        'owner.profileImageKey',
      ])
      // 좋아요 수 계산
      .addSelect('COUNT(likes.id)', 'likeCount')
      // 현재 사용자의 좋아요 여부 확인
      .addSelect(
        currentUserId
          ? `MAX(CASE WHEN likes.id = ${currentUserId} THEN 1 ELSE 0 END)`
          : `0`,
        'isLiked',
      )
      .groupBy('media.id, owner.id');

    const rawResult = (await qb.getRawOne()) as RawMediaItemDetailResult;
    console.log('## rawResult : ', rawResult);

    if (!rawResult) {
      throw new NotFoundException(
        '요청하신 콘텐츠를 찾을 수 없거나 삭제되었습니다.',
      );
    }

    // ManyToMany 관계인 Tags는 별도 쿼리로 가져오는 것이 가장 안정적이다.
    const tagsResult = await this.mediaRepository.findOne({
      where: { id: mediaId },
      relations: ['tags'],
    });
    const tags = tagsResult?.tags.map((t) => t.name) || [];

    // DTO 변환 및 반환
    const item = {
      id: rawResult.media_id,
      title: rawResult.media_title,
      description: rawResult.media_description,
      type: rawResult.media_type,
      width: rawResult.media_width,
      height: rawResult.media_height,

      keyImageLarge: rawResult.media_key_image_large,
      keyImageMedium: rawResult.media_key_image_medium,
      keyImageSmall: rawResult.media_key_image_small,
      keyVideoPlayback: rawResult.media_key_video_playback,
      createdAt: rawResult.media_created_at.toISOString(), // Date 객체를 문자열로 변환

      likeCount: parseInt(rawResult.likeCount, 10) || 0,
      downloadCount: parseInt(rawResult.media_download_count, 10) || 0,
      ownerNickname: rawResult.owner_nickname,
      ownerProfileImageKey: rawResult.owner_profile_image_key,
      tags: tags,
      isLikedByCurrentUser: rawResult.isLiked === 1,
    } as MediaItemDetailDto;

    console.log('## item : ', item);

    return {
      message: '미디어 아이템 상세 조회 성공',
      item,
    };
  }

  // 특정 앨범 ID의 상세 정보와 포함된 모든 ACTIVE 미디어 아이템을 조회
  async findAlbumContents(
    albumId: number,
    currentUserId?: number,
  ): Promise<{
    message: string;
    album: AlbumDetailResponseDto;
  }> {
    const qb = this.albumRepository
      .createQueryBuilder('album')
      .where('album.id = :id AND album.status = :activeStatus', {
        id: albumId,
        activeStatus: ContentStatus.ACTIVE,
      })
      .leftJoinAndSelect('album.owner', 'owner')
      .leftJoinAndSelect('album.tags', 'tag')
      .leftJoinAndSelect(
        'album.mediaItems',
        'media',
        'media.status = :activeStatus',
        { activeStatus: ContentStatus.ACTIVE },
      );

    if (currentUserId) {
      qb.addSelect(
        `MAX(CASE WHEN albumLikes.id = ${currentUserId} THEN 1 ELSE 0 END)`,
        'isLiked',
      );
    }

    const filteredAlbum = await qb.getOne();

    if (!filteredAlbum) {
      throw new NotFoundException(
        '요청하신 앨범을 찾을 수 없거나 삭제되었습니다.',
      );
    }

    // ID 기준 오름차순으로 정렬
    const sortedMediaItems = filteredAlbum.mediaItems.sort(
      (a, b) => a.id - b.id,
    );

    const itemsDto: AlbumMediaItemDto[] = sortedMediaItems.map((item) => ({
      id: item.id,
      type: ContentType.IMAGE,
      width: item.width,
      height: item.height,
      keyImageSmall: item.keyImageSmall,
      keyImageMedium: item.keyImageMedium,
      keyImageLarge: item.keyImageLarge,
    }));

    const isLikedByCurrentUser = currentUserId
      ? filteredAlbum.likedByUsers.some((user) => user.id === currentUserId)
      : false;

    const album = {
      id: filteredAlbum.id,
      title: filteredAlbum.title,
      description: filteredAlbum.description,
      ownerNickname: filteredAlbum.owner.nickname,
      ownerProfileImageKey: filteredAlbum.owner.profileImageKey,
      createdAt: filteredAlbum.createdAt.toISOString(),
      tags: filteredAlbum.tags.map((t) => t.name),
      isLikedByCurrentUser: isLikedByCurrentUser,
      items: itemsDto,
    } as AlbumDetailResponseDto;

    return {
      message: '앨범 상세 조회 성공',
      album,
    };
  }
}
