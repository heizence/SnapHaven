import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { ContentStatus, ContentType } from 'src/common/enums';
import { Album } from 'src/albums/entities/album.entity';
import { S3UtilityService } from 'src/media-pipeline/s3-utility.service';
import { User } from 'src/users/entities/user.entity';
import {
  AlbumMediaItemDto,
  GetAlbumDetailResDto,
} from './dto/album-detail.dto';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { GetAlbumDownloadUrlsResDto } from 'src/media-items/dto/get-download-urls.dto';
import { UpdateContentDto } from 'src/media-items/dto/update-content.dto';
import { RedisService } from 'src/common/redis/redis.service';

@Injectable()
export class AlbumsService {
  constructor(
    @InjectRepository(Album)
    private albumRepository: Repository<Album>,
    @InjectRepository(MediaItem)
    private mediaItemRepository: Repository<MediaItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private s3UtilityService: S3UtilityService,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  // 실제 DB 에서 특정 앨범 ID의 상세 정보와 포함된 모든 ACTIVE 미디어 아이템을 조회
  private async findAlbumContentsFromDb(
    albumId: number,
    currentUserId?: number,
  ) {
    const qb = this.albumRepository
      .createQueryBuilder('album')
      .where('album.id = :id AND album.status = :activeStatus', {
        id: albumId,
        activeStatus: ContentStatus.ACTIVE,
      })
      .leftJoinAndSelect('album.owner', 'owner')
      .withDeleted()
      .leftJoinAndSelect('album.tags', 'tag')
      // 앨범 내 미디어 아이템 조인 및 필요한 필드(isRepresentative) 포함 확인
      .leftJoinAndSelect(
        'album.mediaItems',
        'media',
        'media.status = :activeStatus',
        { activeStatus: ContentStatus.ACTIVE },
      )
      // 정렬 순서: 대표 이미지가 가장 먼저 나오고, 나머지는 생성순 정렬
      .orderBy('media.isRepresentative', 'DESC')
      .addOrderBy('media.createdAt', 'ASC')
      // 앨범 내 대표 콘텐츠의 좋아요 표시 여부를 조회
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(*) > 0', 'isLiked')
          .from('user_media_likes', 'uml')
          .where('uml.media_id = media.id')
          .andWhere('uml.user_id = :currentUserId', {
            currentUserId: currentUserId || 0,
          });
      }, 'isLikedByCurrentUser');

    const { entities, raw } = await qb.getRawAndEntities();
    const albumEntity = entities[0];
    const rawData = raw[0];

    if (!albumEntity) {
      throw new NotFoundException(
        '요청하신 앨범을 찾을 수 없거나 삭제되었습니다.',
      );
    }

    // ID 기준 오름차순으로 정렬
    const sortedMediaItems = albumEntity.mediaItems.sort((a, b) => a.id - b.id);

    let representativeItemId: number = -1;
    const itemsDto: AlbumMediaItemDto[] = sortedMediaItems.map((item) => {
      if (item.isRepresentative) representativeItemId = item.id;
      return {
        id: item.id,
        type: ContentType.IMAGE,
        width: item.width,
        height: item.height,
        keyImageSmall: item.keyImageSmall,
        keyImageMedium: item.keyImageMedium,
        keyImageLarge: item.keyImageLarge,
      };
    });

    const album = {
      id: albumEntity.id,
      title: albumEntity.title,
      description: albumEntity.description,
      ownerId: albumEntity.owner?.id,
      ownerNickname: albumEntity.owner?.nickname || '탈퇴한 회원',
      ownerProfileImageKey: albumEntity.owner?.profileImageKey || null,
      createdAt: albumEntity.createdAt.toISOString(),
      tags: albumEntity.tags.map((t) => t.name),
      isLikedByCurrentUser: rawData?.isLikedByCurrentUser === 1,
      representativeItemId,
      items: itemsDto,
    } as GetAlbumDetailResDto;

    return {
      message: '앨범 상세 조회 성공',
      album,
    };
  }

  // 특정 앨범 ID의 상세 정보와 포함된 모든 ACTIVE 미디어 아이템을 조회
  async findAlbumContents(albumId: number, currentUserId?: number) {
    return await this.redisService.getOrSetAlbumDetail(
      albumId,
      currentUserId,
      () => this.findAlbumContentsFromDb(albumId, currentUserId),
    );
  }

  // 앨범 수정
  async updateAlbum(
    userId: number,
    dto: UpdateContentDto,
  ): Promise<{
    message: string;
  }> {
    const { contentId, title, description } = dto;

    const album = await this.albumRepository.findOne({
      where: { id: contentId },
    });
    if (!album) throw new NotFoundException('앨범을 찾을 수 없습니다.');
    if (album.ownerId !== userId)
      throw new ForbiddenException('수정 권한이 없습니다.');

    // 앨범 업데이트 트랜잭션 시작
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Album, contentId, {
        title,
        description,
      });

      // 앨범에 속한 모든 미디어 아이템 업데이트
      await queryRunner.manager.update(
        MediaItem,
        { albumId: contentId },
        { title, description },
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        '앨범 수정 중 데이터베이스 오류가 발생했습니다.',
      );
    } finally {
      // 연결 해제
      await queryRunner.release();
    }

    this.redisService.delAlbumDetailCache(contentId);

    return { message: '수정이 완료되었습니다.' };
  }

  // 앨범 삭제
  async deleteAlbum(
    userId: number,
    albumId: number,
  ): Promise<{
    message: string;
  }> {
    console.log('[deleteAlbum]start');
    console.log('[deleteAlbum]userId : ', userId);
    console.log('[deleteAlbum]albumId : ', albumId);

    const album = await this.albumRepository.findOne({
      where: { id: albumId },
      relations: ['mediaItems'],
    });

    console.log('[deleteAlbum]album : ', album);

    if (!album) throw new NotFoundException('앨범을 찾을 수 없습니다.');
    if (album.ownerId !== userId)
      throw new ForbiddenException('삭제 권한이 없습니다.');

    // 삭제할 S3 파일 키 수집
    const keysToDelete: string[] = [];
    album.mediaItems.forEach((item) => {
      const keys = [
        item.s3KeyOriginal,
        item.keyImageSmall,
        item.keyImageMedium,
        item.keyImageLarge,
        item.keyVideoPreview,
        item.keyVideoPlayback,
      ];
      keys.forEach((k) => {
        if (k) keysToDelete.push(k);
      });
    });

    // 앨범 삭제 트랜잭션 시작
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 하위 미디어 아이템 상태 변경 및 Soft Delete
      await queryRunner.manager.update(
        MediaItem,
        { albumId },
        { status: ContentStatus.DELETED },
      );
      await queryRunner.manager.softDelete(MediaItem, { albumId: albumId });

      // 앨범 상태 변경 및 Soft Delete
      await queryRunner.manager.update(Album, albumId, {
        status: ContentStatus.DELETED,
      });
      await queryRunner.manager.softDelete(Album, { id: albumId });

      // 트랜잭션 커밋
      await queryRunner.commitTransaction();
    } catch (err) {
      console.error('앨범 삭제 실패 : ', err);
      // 에러 발생 시 롤백
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('DB 삭제 중 오류가 발생했습니다.');
    } finally {
      await queryRunner.release();
    }

    // S3 실제 파일 삭제 (DB 작업 성공 후 수행)
    try {
      if (keysToDelete.length > 0) {
        await this.s3UtilityService.deleteObjects('assets', keysToDelete);
        await this.s3UtilityService.deleteObjects('originals', keysToDelete);
      }
    } catch (err) {
      console.error('S3 파일 삭제 실패 (고아 파일 발생 가능):', err);
    }

    return { message: '삭제되었습니다.' };
  }

  // 앨범 다운로드를 위한 모든 원본 파일 URL 발급
  async getAlbumDownloadUrls(
    albumId: number,
  ): Promise<{ message: string; data: GetAlbumDownloadUrlsResDto }> {
    const album = await this.albumRepository.findOne({
      where: { id: albumId },
      relations: ['mediaItems'],
    });

    if (!album) throw new NotFoundException('앨범을 찾을 수 없습니다.');
    const files = await Promise.all(
      album.mediaItems.map(async (media, index) => {
        const fileExtension = media.s3KeyOriginal.split('.').pop();
        const fileName = `${media.title}_${index}.${fileExtension}`;
        const url = await this.s3UtilityService.getDownloadPresignedUrl(
          media.s3KeyOriginal,
          fileName,
        );
        return { url, fileName };
      }),
    );

    const data = {
      albumTitle: album.title!,
      files,
    };

    return {
      message: '앨범 다운로드 URL 리스트 발급 성공',
      data,
    };
  }
}
