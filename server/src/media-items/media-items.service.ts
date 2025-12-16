import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { MediaItem } from './entities/media-item.entity';
import { GetMediaItemsDto, MediaSort } from './dto/get-media-items.dto';
import { ContentStatus, ContentType } from 'src/common/enums';
import { MediaItemResponseDto } from './dto/media-item-response.dto';
import { MediaItemDetailDto } from './dto/media-item-detail.dto';
import {} from 'src/albums/dto/album-detail.dto';
import { Album } from 'src/albums/entities/album.entity';
import { GetDownloadUrlDto } from './dto/get-download-url.dto';
import { S3UtilityService } from 'src/media-pipeline/s3-utility.service';
import { DownloadRequestDto } from './dto/download.request.dto';
import { User } from 'src/users/entities/user.entity';

export type RawMediaItemResult = {
  media_id: number;
  media_title: string;
  media_type: ContentType;
  media_width: number;
  media_height: number;
  media_key_image_small: string;
  media_key_image_medium: string;
  media_key_image_large: string;
  media_key_video_preview: string;
  media_key_video_playback: string;
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

  // 메인 피드 콘텐츠를 페이지네이션 및 필터링하여 조회
  async findAll(
    query: GetMediaItemsDto,
    currentUserId?: number,
    isFetchingMyUploads?: boolean,
  ): Promise<{
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

      // 내가 업로드한 콘텐츠 필터링(내 업로드 콘텐츠 조회 시 사용)
      .andWhere(
        isFetchingMyUploads ? 'media.ownerId = :currentUserId' : '1=1',
        { currentUserId },
      )

      // 앨범 내에 포함된 아이템들 중 대표 콘텐츠 1건만 불러오기
      .andWhere(
        new Brackets((qb) => {
          qb.where('media.albumId IS NULL') // 일반 개별 사진
            .orWhere('media.isRepresentative = 1'); // 앨범의 대표 사진만
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
      'media.keyVideoPlayback',
      'media.isRepresentative',
      'media.createdAt',
      'user.nickname',
      'album.id',
    ])
      .addSelect('COUNT(likes.id)', 'likeCount')
      .addSelect(
        currentUserId
          ? `(SELECT 1 FROM user_media_likes WHERE user_media_likes.user_id = ${currentUserId} AND user_media_likes.media_id = media.id)`
          : `FALSE`, // 비로그인 시 NULL 반환
        'isLiked',
      )
      .groupBy('media.id, user.id, user.nickname, media.createdAt');

    // 정렬
    if (sort === MediaSort.LATEST) {
      qb.orderBy('media.createdAt', 'DESC');
    } else if (sort === MediaSort.POPULAR) {
      qb.orderBy('likeCount', 'DESC');
    }

    qb.offset(offset).limit(limit);

    const rawItems: RawMediaItemResult[] = await qb.getRawMany();
    const mappedItems: MediaItemResponseDto[] = rawItems.map((rawItem) => ({
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
      message: isFetchingMyUploads
        ? '내 업로드 콘텐츠 조회 성공'
        : '전체 콘텐츠 불러오기 성공',
      items: mappedItems,
      totalCounts,
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
          ? `(SELECT 1 FROM user_media_likes WHERE user_media_likes.user_id = ${currentUserId} AND user_media_likes.media_id = media.id) IS NOT NULL`
          : `FALSE`,
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
      createdAt: rawResult.media_created_at.toISOString(), // Date 객체를 문자열로 변환

      likeCount: parseInt(rawResult.likeCount, 10) || 0,
      downloadCount: parseInt(rawResult.media_download_count, 10) || 0,
      ownerNickname: rawResult.owner_nickname,
      ownerProfileImageKey: rawResult.owner_profile_image_key,
      tags: tags,
      isLikedByCurrentUser: rawResult.isLiked == 1, // isLiked 값이 '1' 로 나옴.
    } as MediaItemDetailDto;

    return {
      message: '미디어 아이템 상세 조회 성공',
      item,
    };
  }

  // 파일 다운로드를 위한 presigned url 을 반환하고 다운로드 카운트 +1 처리
  async getDownloadUrl(
    dto: DownloadRequestDto,
  ): Promise<{ message: string; data: GetDownloadUrlDto }> {
    const s3Key = dto.s3Key;

    // 콘텐츠 유효성 검사 및 키 조회
    const mediaItem = await this.mediaRepository
      .createQueryBuilder('media')
      .where('media.status = :status', { status: ContentStatus.ACTIVE })
      .andWhere(
        new Brackets((qb) => {
          // 전달받은 key와 일치하는 레코드를 찾음
          qb.where('media.keyImageLarge = :key', { key: s3Key })
            .orWhere('media.keyImageMedium = :key', { key: s3Key })
            .orWhere('media.keyImageSmall = :key', { key: s3Key })
            .orWhere('media.keyVideoPlayback = :key', { key: s3Key });
        }),
      )
      .select(['media.id', 'media.title'])
      .getOne();

    if (!mediaItem) {
      throw new NotFoundException('다운로드 가능한 콘텐츠를 찾을 수 없습니다.');
    }

    await this.mediaRepository.increment(
      { id: mediaItem.id },
      'downloadCount',
      1,
    );

    const fileExtension = s3Key.split('.').pop();
    const fileName = `${mediaItem.title}.${fileExtension}`;
    const downloadUrl = this.s3UtilityService.getDownloadUrl(s3Key);

    const data = {
      downloadUrl,
      fileName,
    };

    return { message: '다운로드 링크 생성 성공', data };
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
    if (isCurrentlyLiked) {
      // likedMediaItems 배열에서 해당 미디어 아이템 제거
      user.likedMediaItems = user.likedMediaItems.filter(
        (item) => item.id !== mediaId,
      );
      await this.userRepository.save(user); // 관계 테이블에서 레코드 삭제
      return { message: '좋아요 취소 처리가 완료되었습니다.', isLiked: false };
    } else {
      // 미디어 아이템을 관계 배열에 추가
      user.likedMediaItems.push(mediaItem);

      await this.userRepository.save(user); // 관계 테이블에 레코드 추가

      return { message: '좋아요 처리가 완료되었습니다.', isLiked: true };
    }
  }

  // 사용자가 좋아요 표시한 콘텐츠들을 조회
  async getLikedMediaItems(
    userId: number,
    query: GetMediaItemsDto,
  ): Promise<{ message: string; likedItems: MediaItemResponseDto[] }> {
    const { page } = query;
    const limit = 40;
    const offset = (page - 1) * limit;

    const qb = this.mediaRepository
      .createQueryBuilder('media')
      // 좋아요 테이블과 JOIN (현재 사용자가 좋아요 누른 것만)
      .innerJoin('user_media_likes', 'uml', 'uml.media_id = media.id')
      .where('uml.user_id = :userId', { userId })
      .andWhere('media.status = :status', { status: ContentStatus.ACTIVE })

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

    return { message: '좋아요 표시한 콘텐츠 조회 성공', likedItems };
  }
}
