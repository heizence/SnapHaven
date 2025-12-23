import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
  ) {}

  // 특정 앨범 ID의 상세 정보와 포함된 모든 ACTIVE 미디어 아이템을 조회
  async findAlbumContents(
    albumId: number,
    currentUserId?: number,
  ): Promise<{
    message: string;
    album: GetAlbumDetailResDto;
  }> {
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

    const isLikedByCurrentUser = rawData?.isLikedByCurrentUser === 1;

    const album = {
      id: albumEntity.id,
      title: albumEntity.title,
      description: albumEntity.description,
      ownerNickname: albumEntity.owner?.nickname || '탈퇴한 회원',
      ownerProfileImageKey: albumEntity.owner?.profileImageKey || null,
      createdAt: albumEntity.createdAt.toISOString(),
      tags: albumEntity.tags.map((t) => t.name),
      isLikedByCurrentUser: isLikedByCurrentUser,
      representativeItemId,
      items: itemsDto,
    } as GetAlbumDetailResDto;

    return {
      message: '앨범 상세 조회 성공',
      album,
    };
  }

  // 앨범 아이템 좋아요 표시/취소 기능
  async toggleLikedAlbum(
    albumId: number,
    userId: number,
  ): Promise<{ message: string; isLiked: boolean }> {
    if (!userId) {
      throw new UnauthorizedException(
        '로그인된 사용자만 좋아요를 누를 수 있습니다.',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['likedAlbums'],
    });

    const album = await this.albumRepository.findOne({
      where: { id: albumId },
      relations: ['likedByUsers'],
    });

    if (!user || !album) {
      throw new NotFoundException('사용자 또는 앨범을 찾을 수 없습니다.');
    }

    const isCurrentlyLiked = user.likedAlbums.some(
      (item) => item.id === albumId,
    );
    if (isCurrentlyLiked) {
      // likedMediaItems 배열에서 해당 미디어 아이템 제거
      user.likedAlbums = user.likedAlbums.filter((item) => item.id !== albumId);
      await this.userRepository.save(user); // 관계 테이블에서 레코드 삭제

      return { message: '좋아요 취소 처리가 완료되었습니다.', isLiked: false };
    } else {
      user.likedAlbums.push(album);
      await this.userRepository.save(user); // 관계 테이블에 레코드 추가

      return { message: '좋아요 처리가 완료되었습니다.', isLiked: true };
    }
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
