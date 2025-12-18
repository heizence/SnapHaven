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

const archiver = require('archiver'); // Do not convert to import.

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

  /**
   * 앨범의 모든 S3 파일을 ZIP으로 압축하여 HTTP 응답 스트림으로 보낸다
   * @param mediaItems { key: string, title: string }[] S3 Key와 파일명 배열
   * @param res Fastify/Express Response 객체
   * @param albumTitle ZIP 파일 이름에 사용할 앨범 제목
   */
  async streamAlbumZip(
    mediaItems: { key: string; title: string }[],
    res: any, // Express.Response 또는 FastifyReply 타입
    albumTitle: string,
  ): Promise<void> {
    const zipFileName = `${albumTitle}_Album.zip`;

    // HTTP 헤더 설정: ZIP 파일 다운로드를 강제
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURI(zipFileName)}"`,
    );

    // ZIP 아카이브 생성 및 HTTP 응답 스트림과 연결
    const archive = archiver('zip', {
      zlib: { level: 9 }, // 압축 레벨 설정
    });
    archive.pipe(res);

    archive.on('error', (err) => {
      console.error('Archiver Error:', err);
      res
        .status(500)
        .send({ message: '파일 압축 및 스트리밍 중 오류가 발생했습니다.' });
    });

    const finalizePromise = new Promise<void>(async (resolve, reject) => {
      archive.on('warning', (err) => {
        console.warn('Archiver Warning:', err);
      });

      archive.on('finish', () => {
        // 'finish' 또는 'close' 이벤트 사용
        console.log('Archiver finalized and finished writing.');
        resolve();
      });

      archive.on('error', reject); // 에러 발생 시 reject

      console.log('mediaItems : ', mediaItems);
      // 3. 파일 처리 루프 실행: 각 파일의 append가 완료될 때까지 await
      for (const item of mediaItems) {
        const fileExtension = item.key.split('.').pop() || 'file';
        const fileName = `${item.title}.${fileExtension}`;

        try {
          const fileStream = await this.s3UtilityService.getS3FileStream(
            item.key,
            fileName,
          );

          archive.append(fileStream, { name: fileName });
        } catch (error) {
          console.error(
            `[ZIP Error] 최종 실패: ${fileName}. 이 파일을 건너뜁니다.`,
          );
        }
      }

      archive.finalize();
    });

    // 압축 완료 및 스트림 종료
    await finalizePromise;
  }

  /**
   * ZIP 다운로드를 위한 메인 로직
   */
  async downloadAlbumZip(albumId: number, res: any): Promise<void> {
    console.log('#downloadAlbumZip. albumId : ', albumId);

    // 앨범 제목 가져오기 (가정: 앨범 ID로 조회 가능)
    const album = await this.albumRepository
      .createQueryBuilder('album')
      // mediaItems 관계를 'mediaItem'이라는 별칭으로 LEFT JOIN하고 데이터를 선택합니다.
      .leftJoinAndSelect('album.mediaItems', 'mediaItem')

      // 앨범과 미디어 아이템에서 필요한 필드만 명시적으로 선택
      .select([
        'album.id',
        'album.title',
        'mediaItem.id',
        'mediaItem.title',
        'mediaItem.keyImageLarge',
        'mediaItem.keyVideoPlayback',
        'mediaItem.status',
      ])
      .where('album.id = :id', { id: albumId })
      .andWhere('album.status = :status', { status: ContentStatus.ACTIVE })
      .getOne(); // 단일 결과를 가져옵니다.

    if (!album) {
      throw new NotFoundException('다운로드할 활성 콘텐츠가 없는 앨범입니다.');
    }

    const albumTitle = album?.title || `Album_${albumId}`;

    const mediaItems: { key: string; title: string }[] = album.mediaItems
      .filter((item) => item.status === ContentStatus.ACTIVE)
      .map((item) => {
        const downloadKey = item.keyImageLarge || item.keyVideoPlayback;

        if (downloadKey) {
          return { key: downloadKey, title: item.title + '_' + item.id };
        }
        return null;
      })
      .filter((item): item is { key: string; title: string } => item !== null);

    console.log('[albums.service]mediaItems : ', mediaItems);
    if (mediaItems.length === 0) {
      throw new NotFoundException('다운로드할 활성 콘텐츠가 없습니다.');
    }

    // ZIP 서비스에 스트리밍 위임
    await this.streamAlbumZip(mediaItems, res, albumTitle);
  }

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
}
