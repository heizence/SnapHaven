import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ContentStatus } from 'src/common/enums';
import { Album } from 'src/albums/entities/album.entity';
import { S3UtilityService } from 'src/media-pipeline/s3-utility.service';

const archiver = require('archiver'); // Do not convert to import.

@Injectable()
export class AlbumsService {
  constructor(
    @InjectRepository(Album)
    private albumRepository: Repository<Album>,
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
}
