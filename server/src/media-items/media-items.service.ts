import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { MediaItem } from './entities/media-item.entity';
import { GetMediaItemsReqDto, MediaSort } from './dto/get-media-items.dto';
import { ContentStatus, ContentType } from 'src/common/enums';
import { MediaItemDto } from './dto/media-items.dto';
import { GetMediaItemDetailResDto } from './dto/get-media-item-detail.dto';
import {} from 'src/albums/dto/album-detail.dto';
import { Album } from 'src/albums/entities/album.entity';
import { S3UtilityService } from 'src/media-pipeline/s3-utility.service';
import { User } from 'src/users/entities/user.entity';
import { GetItemDownloadUrlResDto } from './dto/get-download-urls.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { RedisService } from 'src/common/redis/redis.service';

export type RawMediaItemResult = {
  media_id: number;
  media_title: string;
  media_status: ContentStatus;
  media_type: ContentType;
  media_width: number;
  media_height: number;
  media_key_image_small: string;
  media_key_image_medium: string;
  media_key_image_large: string;
  media_key_video_preview: string;
  media_key_video_playback: string;
  media_created_at: Date;
  user_nickname: string;
  album_id: number | null;
  likeCount: string;
  isLiked: number; // 쿼리 결과는 문자열 또는 숫자 형태로 옴
};

interface RawMediaItemDetailResult {
  media_id: string;
  media_title: string;
  media_description: string | null;
  media_type: ContentType;
  media_width: number;
  media_height: number;
  media_download_count: string;
  media_key_image_large: string | null;
  media_key_image_medium: string | null;
  media_key_image_small: string | null;
  media_key_video_playback: string | null;
  media_key_video_preview: string | null;
  media_created_at: Date;
  owner_id: string;
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
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private s3UtilityService: S3UtilityService,
    private dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  // 조건에 따라 불러온 미디어 아이템 총 갯수 구하기
  async getItemsCount(
    type: string,
    tag?: string,
    keyword?: string,
    isFetchingMyUploads?: boolean,
    currentUserId?: number,
  ): Promise<number> {
    const countQb = this.mediaRepository
      .createQueryBuilder('media')
      .where('media.status = :status', { status: ContentStatus.ACTIVE })
      .andWhere(
        new Brackets((sqb) => {
          sqb.where('media.albumId IS NULL').orWhere(
            `media.id = (
            SELECT MIN(t1.id)
            FROM media_items t1
            WHERE t1.album_id = media.album_id
            AND t1.status = :activeStatus
          )`,
            { activeStatus: ContentStatus.ACTIVE },
          );
        }),
      )
      .andWhere(type !== 'ALL' ? 'media.type = :type' : '1=1', { type })
      // 내가 업로드한 콘텐츠 필터링(내 업로드 콘텐츠 조회 시 사용)
      .andWhere(
        isFetchingMyUploads ? 'media.ownerId = :currentUserId' : '1=1',
        { currentUserId },
      );

    if (tag) {
      countQb.leftJoin('media.tags', 'tag').andWhere('tag.name = :searchTag', {
        searchTag: tag,
      });
    }

    if (keyword) {
      const searchPattern = `%${keyword}%`;
      countQb.andWhere(
        new Brackets((where) => {
          where
            .where('media.title LIKE :searchPattern', { searchPattern })
            .orWhere('media.description LIKE :searchPattern', {
              searchPattern,
            });
        }),
      );
    }
    const totalCounts = await countQb.getCount();
    return totalCounts;
  }

  // 메인 피드 콘텐츠를 DB 에서 조회
  private async findAllFromDb(
    query: GetMediaItemsReqDto,
    currentUserId?: number,
    isFetchingMyUploads?: boolean,
  ) {
    const limit = 40;
    const { page, sort, type, keyword, tag } = query;
    const offset = (page - 1) * limit;

    const qb = this.mediaRepository
      .createQueryBuilder('media')
      .where('media.status = :status', { status: ContentStatus.ACTIVE })
      .andWhere(
        new Brackets((subQb) => {
          subQb
            .where('media.albumId IS NULL') // 단일 콘텐츠인 경우 그대로 노출
            .orWhere('album.status = :status', {
              status: ContentStatus.ACTIVE,
            }); // 앨범 콘텐츠인 경우 앨범도 ACTIVE여야 함
        }),
      )

      // 내가 업로드한 콘텐츠 필터링(내 업로드 콘텐츠 조회 시 사용)
      .andWhere(
        isFetchingMyUploads ? 'media.ownerId = :currentUserId' : '1=1',
        { currentUserId },
      )

      // 앨범 내 아이템 중 대표 콘텐츠만 필터링
      .andWhere(
        new Brackets((subQb) => {
          subQb
            .where('media.albumId IS NULL')
            .orWhere('media.isRepresentative = 1');
        }),
      )
      .leftJoin('media.owner', 'user')
      .leftJoin('media.likedByUsers', 'likes')
      .leftJoin('media.tags', 'tag')
      .leftJoin('media.album', 'album')

      .andWhere(type !== 'ALL' ? 'media.type = :type' : '1=1', { type });
    if (tag) {
      qb.andWhere('tag.name = :searchTag', { searchTag: tag });
    }
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
      'media.keyVideoPlayback',
      'media.isRepresentative',
      'media.createdAt',
      'user.nickname',
      'album.id',
    ])
      // DISTINCT를 추가하여 조인으로 인한 중복 카운트 방지
      .addSelect('COUNT(DISTINCT likes.id)', 'likeCount')
      // 서브쿼리에 LIMIT 1을 추가하여 성능 최적화 및 결과 보장
      .addSelect(
        currentUserId
          ? `(SELECT 1 FROM user_media_likes WHERE user_media_likes.user_id = ${currentUserId} AND user_media_likes.media_id = media.id LIMIT 1)`
          : `FALSE`,
        'isLiked',
      )
      .groupBy('media.id')
      .addGroupBy('user.id')
      .addGroupBy('album.id');

    if (sort === MediaSort.LATEST) {
      qb.orderBy('media.createdAt', 'DESC').addOrderBy('media.id', 'DESC');
    } else if (sort === MediaSort.POPULAR) {
      qb.orderBy('likeCount', 'DESC').addOrderBy('media.id', 'DESC');
    } else {
      // 기본 정렬값 명시
      qb.orderBy('media.id', 'DESC');
    }

    qb.offset(offset).limit(limit);

    const rawItems: RawMediaItemResult[] = await qb.getRawMany();
    const mappedItems: MediaItemDto[] = rawItems.map((rawItem) => ({
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
      createdAt: rawItem.media_created_at,
      albumId: rawItem.album_id || null,
      isLikedByCurrentUser: rawItem.isLiked === 1,
    }));

    const totalCounts = await this.getItemsCount(
      type,
      tag,
      keyword,
      isFetchingMyUploads,
      currentUserId,
    );

    return {
      message: isFetchingMyUploads ? '내 업로드 조회 성공' : '전체 조회 성공',
      items: mappedItems,
      totalCounts,
    };
  }

  // 메인 피드 콘텐츠를 redis 또는 실제 DB 에서 조회
  async findAll(
    query: GetMediaItemsReqDto,
    currentUserId?: number,
    isFetchingMyUploads?: boolean,
  ) {
    // RedisService에 모든 판단을 맡깁니다.
    return await this.redisService.getOrSetMediaList(
      query,
      () => this.findAllFromDb(query, currentUserId, isFetchingMyUploads), // DB 실행 콜백
      currentUserId,
      isFetchingMyUploads,
    );
  }

  // 단일 미디어 아이템 상세 정보를 DB 에서 조회
  private async findOneFromDb(mediaId: number, currentUserId?: number) {
    const qb = this.mediaRepository
      .createQueryBuilder('media')
      .where('media.id = :id', { id: mediaId })
      .andWhere('media.status = :status', { status: ContentStatus.ACTIVE })
      .leftJoin('media.owner', 'owner')
      .withDeleted()
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
        'owner.id',
        'owner.nickname',
        'owner.profileImageKey',
      ])
      .addSelect('COUNT(likes.id)', 'likeCount')
      .addSelect(
        currentUserId
          ? `(SELECT 1 FROM user_media_likes WHERE user_media_likes.user_id = ${currentUserId} AND user_media_likes.media_id = media.id LIMIT 1) IS NOT NULL`
          : `FALSE`,
        'isLiked',
      )
      .groupBy('media.id, owner.id');

    const rawResult = (await qb.getRawOne()) as RawMediaItemDetailResult;

    if (!rawResult) {
      throw new NotFoundException(
        '요청하신 콘텐츠를 찾을 수 없거나 삭제되었습니다.',
      );
    }

    const tagsResult = await this.mediaRepository.findOne({
      where: { id: mediaId },
      relations: ['tags'],
    });
    const tags = tagsResult?.tags.map((t) => t.name) || [];

    const item = {
      id: parseInt(rawResult.media_id, 10),
      title: rawResult.media_title,
      description: rawResult.media_description,
      type: rawResult.media_type,
      width: rawResult.media_width,
      height: rawResult.media_height,
      keyImageLarge: rawResult.media_key_image_large,
      keyImageMedium: rawResult.media_key_image_medium,
      keyImageSmall: rawResult.media_key_image_small,
      keyVideoPlayback: rawResult.media_key_video_playback,
      createdAt: rawResult.media_created_at.toISOString(),
      likeCount: parseInt(rawResult.likeCount, 10) || 0,
      downloadCount: parseInt(rawResult.media_download_count, 10) || 0,
      ownerId: parseInt(rawResult.owner_id, 10),
      ownerNickname: rawResult.owner_nickname || '탈퇴한 회원',
      ownerProfileImageKey: rawResult.owner_profile_image_key,
      tags: tags,
      isLikedByCurrentUser: rawResult.isLiked == 1, // isLiked 값이 '1' 로 나옴.
    } as GetMediaItemDetailResDto;

    return {
      message: '미디어 아이템 상세 조회 성공',
      item,
    };
  }

  // 단일 미디어 아이템 상세 정보를 조회
  async findOne(mediaId: number, currentUserId?: number) {
    return await this.redisService.getOrSetMediaDetail(
      mediaId,
      currentUserId,
      () => this.findOneFromDb(mediaId, currentUserId),
    );
  }

  // 파일 다운로드를 위한 presigned url 을 반환하고 다운로드 카운트 +1 처리
  async getItemDownloadUrl(
    id: number,
  ): Promise<{ message: string; data: GetItemDownloadUrlResDto }> {
    const mediaItem = await this.mediaRepository.findOne({ where: { id } });
    if (!mediaItem) throw new NotFoundException('아이템을 찾을 수 없습니다.');

    const fileExtension = mediaItem.s3KeyOriginal.split('.').pop();
    const fileName = `${mediaItem.title}.${fileExtension}`;

    const url = await this.s3UtilityService.getDownloadPresignedUrl(
      mediaItem.s3KeyOriginal,
      fileName,
    );

    await this.mediaRepository.increment(
      { id: mediaItem.id },
      'downloadCount',
      1,
    );

    const data = {
      url,
      fileName,
    };

    return {
      message: '다운로드 URL 발급 성공',
      data,
    };
  }

  // 미디어 아이템 좋아요 표시/취소 기능
  async toggleLikedItem(
    mediaId: number,
    userId: number,
  ): Promise<{ message: string; isLiked: boolean }> {
    if (!userId) {
      throw new UnauthorizedException(
        '로그인된 사용자만 좋아요를 누를 수 있습니다.',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['likedMediaItems'],
    });
    const mediaItem = await this.mediaRepository.findOne({
      where: { id: mediaId },
    });

    if (!user || !mediaItem) {
      throw new NotFoundException('사용자 또는 콘텐츠를 찾을 수 없습니다.');
    }

    const isCurrentlyLiked = user.likedMediaItems.some(
      (item) => item.id === mediaId,
    );
    let resMessage: string;
    if (isCurrentlyLiked) {
      // likedMediaItems 배열에서 해당 미디어 아이템 제거
      user.likedMediaItems = user.likedMediaItems.filter(
        (item) => item.id !== mediaId,
      );
      await this.userRepository.save(user); // 관계 테이블에서 레코드 삭제

      resMessage = '좋아요 취소 처리가 완료되었습니다.';
    } else {
      // 미디어 아이템을 관계 배열에 추가
      user.likedMediaItems.push(mediaItem);

      await this.userRepository.save(user); // 관계 테이블에 레코드 추가
      resMessage = '좋아요 처리가 완료되었습니다.';
    }

    await Promise.all([
      this.redisService.delUserMediaDetailCache(mediaId, userId),
      this.redisService.delUserFeedsCache(userId),
      this.redisService.delProfileCache(userId),
    ]);

    return { message: resMessage, isLiked: true };
  }

  // 사용자가 좋아요 표시한 콘텐츠들을 조회
  async getLikedMediaItems(
    userId: number,
    query: GetMediaItemsReqDto,
  ): Promise<{ message: string; items: MediaItemDto[] }> {
    const { page } = query;
    const limit = 40;
    const offset = (page - 1) * limit;

    const qb = this.mediaRepository
      .createQueryBuilder('media')
      .withDeleted()
      // 좋아요 테이블과 JOIN (현재 사용자가 좋아요 누른 것만)
      .innerJoin('user_media_likes', 'uml', 'uml.media_id = media.id')
      .where('uml.user_id = :userId', { userId })
      .andWhere('media.status IN (:...statuses)', {
        statuses: [ContentStatus.ACTIVE, ContentStatus.DELETED],
      })

      // 앨범의 대표 콘텐츠만 조회
      .andWhere(
        new Brackets((qb) => {
          qb.where('media.albumId IS NULL').orWhere(
            'media.isRepresentative = 1',
          );
        }),
      )

      // 작성자 및 앨범 정보 조인
      .leftJoin('media.owner', 'user')
      .leftJoin('media.album', 'album')
      .leftJoin('media.likedByUsers', 'allLikes') // 전체 좋아요 수 계산용

      .select([
        'media.id',
        'media.title',
        'media.type',
        'media.status',
        'media.width',
        'media.height',
        'media.keyImageSmall',
        'media.keyImageMedium',
        'media.keyImageLarge',
        'media.keyVideoPreview',
        'media.keyVideoPlayback',
        'album.id',
      ])
      .addSelect('COUNT(allLikes.id)', 'likeCount')

      // 좋아요를 최근에 누른 순서대로 정렬
      .addSelect('MAX(uml.created_at)', 'likedAt')
      .groupBy('media.id, user.id, album.id')
      .orderBy('likedAt', 'DESC')
      .offset(offset)
      .limit(limit);

    const rawItems: RawMediaItemResult[] = await qb.getRawMany();

    const likedItems = rawItems.map((raw) => ({
      id: raw.media_id,
      title: raw.media_title,
      status: raw.media_status,
      type: raw.media_type,
      width: raw.media_width,
      height: raw.media_height,
      keyImageSmall: raw.media_key_image_small,
      keyImageMedium: raw.media_key_image_medium,
      keyImageLarge: raw.media_key_image_large,
      keyVideoPreview: raw.media_key_video_preview,
      keyVideoPlayback: raw.media_key_video_playback,
      isLikedByCurrentUser: true, // 좋아요 목록이므로 무조건 true
      albumId: raw.album_id || null,
    }));

    return { message: '좋아요 표시한 콘텐츠 조회 성공', items: likedItems };
  }

  // 미디어 아이템 수정
  async updateMediaItem(
    userId: number,
    dto: UpdateContentDto,
  ): Promise<{
    message: string;
  }> {
    const { contentId, title, description } = dto;
    const media = await this.mediaRepository.findOne({
      where: { id: contentId },
    });

    if (!media) throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    if (media.ownerId !== userId)
      throw new ForbiddenException('수정 권한이 없습니다.');

    await this.mediaRepository.update(contentId, {
      title,
      description,
    });
    await this.redisService.delUserMediaDetailCache(dto.contentId, userId);
    return { message: '수정이 완료되었습니다.' };
  }

  // 미디어 아이템 삭제
  async deleteMediaItem(
    userId: number,
    mediaId: number,
  ): Promise<{
    message: string;
  }> {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId },
    });
    if (!media) throw new NotFoundException('아이템을 찾을 수 없습니다.');
    if (media.ownerId !== userId)
      throw new ForbiddenException('삭제 권한이 없습니다.');

    // 삭제할 S3 파일 키 수집
    const keysToDelete = [
      media.s3KeyOriginal,
      media.keyImageSmall,
      media.keyImageMedium,
      media.keyImageLarge,
      media.keyVideoPreview,
      media.keyVideoPlayback,
    ].filter(Boolean) as string[];

    //  트랜잭션 시작
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(MediaItem, mediaId, {
        status: ContentStatus.DELETED,
      });

      await queryRunner.manager.softDelete(MediaItem, mediaId);

      await queryRunner.commitTransaction();

      await Promise.all([
        this.redisService.delMediaDetailCache(mediaId), // 상세 페이지 캐시 삭제
        this.redisService.delMediaListCache(), // 메인 목록 캐시 삭제
      ]);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        '데이터베이스 삭제 처리 중 오류가 발생했습니다.',
      );
    } finally {
      await queryRunner.release();
    }

    // S3 실제 파일 삭제
    try {
      await this.s3UtilityService.deleteObjects('assets', keysToDelete);
      await this.s3UtilityService.deleteObjects('originals', keysToDelete);
    } catch (err) {
      console.error('S3 파일 삭제 실패 (고아 파일 발생 가능):', err);
    }

    return { message: '삭제되었습니다.' };
  }
}
