import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { S3UtilityService } from 'src/media-pipeline/s3-utility.service';
import { TagsService } from 'src/tags/tags.service';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { Album } from 'src/albums/entities/album.entity';
import { ContentStatus, ContentType } from 'src/common/enums';
import { RequestUrlsDto } from './dto/request-urls.dto';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MediaUploadedEvent } from 'src/media-pipeline/events/media-uploaded.event';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(MediaItem)
    private readonly mediaItemRepository: Repository<MediaItem>,
    @InjectRepository(Album)
    private readonly albumRepository: Repository<Album>,
    private readonly tagsService: TagsService,
    private readonly s3UtilityService: S3UtilityService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private determineContentType(mimeType: string): ContentType {
    if (mimeType.startsWith('video/')) return ContentType.VIDEO;
    return ContentType.IMAGE;
  }

  private getS3KeyPrefix(contentType: ContentType): string {
    return contentType === ContentType.VIDEO ? 'videos' : 'images';
  }

  // 파일 업로드 준비(presigned url 발급 및 메타데이터 저장)
  async readyToUpload(
    ownerId: number,
    dto: RequestUrlsDto,
  ): Promise<{
    message: string;
    urls: Array<{ fileIndex: number; signedUrl: string; s3Key: string }>;
    albumId?: number;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let albumId: number | undefined = undefined;
      const tagsArray = dto.tags || [];
      const tagEntities = await this.tagsService.findTagsByName(tagsArray);
      const isAlbum = dto.isAlbumUpload || dto.files.length > 1;

      // 1. 앨범 생성
      if (isAlbum) {
        const album = queryRunner.manager.create(Album, {
          ownerId,
          title: dto.title,
          description: dto.description,
          tags: tagEntities,
        });
        const savedAlbum = await queryRunner.manager.save(album);
        albumId = savedAlbum.id;
      }

      // 2. Presigned URL 준비 + MediaItem 데이터 준비 (병렬)
      const fileMetaList = await Promise.all(
        dto.files.map(async (file, index) => {
          const contentType = this.determineContentType(file.type);
          const fileExtension = file.name.split('.').pop() || 'dat';
          const s3Key = `media_items/${this.getS3KeyPrefix(contentType)}/${uuidv4()}.${fileExtension}`;

          const signedUrl = await this.s3UtilityService.getPresignedPutUrl(
            s3Key,
            file.type,
            file.size,
          );

          return {
            index,
            signedUrl,
            s3Key,
            mediaItemData: {
              ownerId,
              albumId,
              title: dto.title,
              description: dto.description,
              type: contentType,
              s3KeyOriginal: s3Key,
              tags: tagEntities,
              status: ContentStatus.PENDING,
            },
          };
        }),
      );

      // 3. DB Bulk Insert
      const mediaItems = fileMetaList.map((meta) =>
        queryRunner.manager.create(MediaItem, meta.mediaItemData),
      );
      await queryRunner.manager.save(MediaItem, mediaItems);
      await queryRunner.commitTransaction();

      return {
        message: '업로드 준비 및 Presigned Url 발급 완료',
        urls: fileMetaList.map((meta) => ({
          fileIndex: meta.index,
          signedUrl: meta.signedUrl,
          s3Key: meta.s3Key,
        })),
        albumId,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('URL 발급 및 DB 레코드 생성 실패');
    } finally {
      await queryRunner.release();
    }
  }

  // 클라이언트에서 s3 key 를 보내줬을 때 이후 파일 처리 작업 진행
  async requestProcessing(
    ownerId: number,
    s3Keys: string[],
    albumId?: number,
  ): Promise<{ message: string }> {
    // [DB 조회] 클라이언트가 업로드 완료를 알린 S3 Key를 기반으로 PENDING 레코드를 조회
    const mediaItems = await this.mediaItemRepository.find({
      where: {
        s3KeyOriginal: In(s3Keys), // [!code focus] // S3 키 목록에 포함되는지 확인
        status: ContentStatus.PENDING,
        ownerId: ownerId,
        albumId: albumId || undefined, // 앨범 ID가 있다면 조건에 포함
      },
    });

    // [유효성 검사] PENDING 상태의 레코드가 하나도 없거나 키가 불일치 시 에러
    if (mediaItems.length === 0) {
      throw new BadRequestException(
        '완료할 유효한 PENDING 상태의 미디어 항목을 찾을 수 없습니다.',
      );
    }

    // [상태 업데이트] PENDING -> PROCESSING으로 변경 (FR-SYS-006 직전)
    // 개별적으로 처리하지 않고 한 번의 쿼리로 업데이트 (성능 최적화)
    await this.mediaItemRepository.update(
      { id: In(mediaItems.map((item) => item.id)) },
      { status: ContentStatus.PROCESSING },
    );

    // [이벤트 발행] 각 미디어 항목에 대해 비동기 파이프라인 시작 요청
    for (const item of mediaItems) {
      // 파이프라인이 S3에서 다운로드하고 변환할 수 있도록 이벤트 발행
      this.eventEmitter.emit('media.uploaded', {
        mediaId: item.id,
        s3Key: item.s3KeyOriginal,
        mimeType: item.type === ContentType.IMAGE ? 'image/jpeg' : 'video/mp4', // MIME 타입 추정
        contentType: item.type,
      } as MediaUploadedEvent);
    }

    return { message: '파일 백그라운드 처리 중' };
  }
}
