import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm'; //  DataSource 를 사용하여 트랜잭션 관리
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { ContentStatus, ContentType } from 'src/common/enums';
import { TagsService } from 'src/tags/tags.service';
import { MediaUploadedEvent } from './events/media-uploaded.event';
import { UploadContentDto } from 'src/upload/dto/upload-content.dto';
import { Album } from 'src/albums/entities/album.entity';
import { S3UtilityService } from './s3-utility.service';
import {
  MediaProcessorService,
  ProcessedUrls,
} from './media-processor.service';

// MIME 타입을 기반으로 ContentType을 결정
function determineContentType(mimeType: string): ContentType {
  if (mimeType.startsWith('image/bmp') || mimeType.startsWith('image/tiff')) {
    // 압축률이 낮아 비효율적인 포맷은 여기서 즉시 차단
    throw new BadRequestException('지원하지 않는 형식입니다.');
  }
  if (mimeType.startsWith('image/')) return ContentType.IMAGE;
  if (mimeType.startsWith('video/')) return ContentType.VIDEO;

  throw new InternalServerErrorException('지원하지 않는 형식입니다.');
}

@Injectable()
export class MediaPipelineService {
  private readonly logger = new Logger(MediaPipelineService.name);

  constructor(
    @InjectRepository(MediaItem)
    private readonly mediaRepository: Repository<MediaItem>,
    @InjectRepository(Album)
    private readonly albumRepository: Repository<Album>,

    private readonly tagsService: TagsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource, // 트랜잭션을 위한 DataSource

    private readonly s3UtilityService: S3UtilityService,
    private readonly mediaProcessorService: MediaProcessorService,
  ) {}

  /**
   * [동기] 다중 파일 업로드 요청 처리 (트랜잭션 적용)
   * 하나의 트랜잭션으로 여러 media_items 레코드를 생성하고 이벤트 발행
   */
  async processMultipleUploads(
    ownerId: number,
    files: Express.Multer.File[],
    dto: UploadContentDto,
    contentType: ContentType,
  ): Promise<{ message: string; mediaIds: number[] }> {
    console.log('[media-pipeline.service]processMultipleUploads start.');
    console.log('[media-pipeline.service]ownerId : ', ownerId);
    console.log('[media-pipeline.service]files : ', files);
    console.log('[media-pipeline.service]dto : ', dto);
    console.log('[media-pipeline.service]contentType : ', contentType);
    //  태그 조회
    const tagsArray = dto.tags
      ? dto.tags.split(',').map((tag) => tag.trim())
      : [];
    const tagEntities = await this.tagsService.findTagsByName(tagsArray);
    console.log('[media-pipeline.service]tagsArray : ', tagsArray);
    console.log('[media-pipeline.service]tagEntities : ', tagEntities);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let albumId: number | null = null;
      const isAlbum = dto.isAlbumUpload === 'true';
      console.log('[media-pipeline.service]albumId : ', albumId);
      console.log('[media-pipeline.service]isAlbum : ', isAlbum);
      // 앨범 생성 조건 검사
      if (isAlbum) {
        const album = queryRunner.manager.create(Album, {
          ownerId,
          title: dto.title,
          description: dto.description,
          tags: tagEntities,
        });
        const savedAlbum = await queryRunner.manager.save(album);
        albumId = savedAlbum.id;
        console.log('[media-pipeline.service]album : ', album);
      }

      const mediaIds: number[] = [];

      for (const file of files) {
        console.log('[media-pipeline.service]handle each files in for loop');
        const fileContentType = determineContentType(file.mimetype);
        console.log(
          '[media-pipeline.service]fileContentType : ',
          fileContentType,
        );
        if (fileContentType !== contentType) {
          // 이미지 엔드포인트에 비디오가 오면 실패 처리 (혹은 반대)
          throw new InternalServerErrorException(
            `Invalid file type in bundle: Expected ${contentType}, got ${fileContentType}`,
          );
        }

        const s3Key = (file as any).key;
        if (!s3Key) {
          throw new InternalServerErrorException(
            'S3 키가 누락되었습니다. Multer-S3 설정 확인 필요.',
          );
        }

        const finalS3Key = `media_items/${path.basename(s3Key)}`;

        console.log('[media-pipeline.service]s3Key : ', s3Key);
        // MediaItem 레코드 생성
        const mediaItem = queryRunner.manager.create(MediaItem, {
          ownerId,
          albumId: albumId,
          title: dto.title,
          description: dto.description || null,
          type: fileContentType,
          //s3KeyOriginal: s3Key,
          s3KeyOriginal: finalS3Key,
          tags: tagEntities,
          status: ContentStatus.PENDING,
        });
        console.log('[media-pipeline.service]mediaItem : ', mediaItem);
        const savedMediaItem = await queryRunner.manager.save(mediaItem);
        mediaIds.push(savedMediaItem.id);
        console.log(
          '[media-pipeline.service]savedMediaItem : ',
          savedMediaItem,
        );

        // [비동기 시작] 개별 미디어에 대한 이벤트 발행
        this.eventEmitter.emit('media.uploaded', {
          mediaId: savedMediaItem.id,
          s3Key: finalS3Key,
          mimeType: file.mimetype,
          contentType,
        } as MediaUploadedEvent);
      }

      await queryRunner.commitTransaction(); // 모든 파일 DB 저장 성공 시 커밋
      return {
        message: '업로드가 수락되었습니다. 처리를 시작합니다.',
        mediaIds,
      };
    } catch (error) {
      console.error(error);
      await queryRunner.rollbackTransaction(); // 하나라도 실패하면 전체 롤백
      throw new InternalServerErrorException(
        '콘텐츠 업로드 중 DB 처리 실패 (전체 롤백됨).',
      );
    } finally {
      await queryRunner.release();
    }
  }

  // [비동기 워커] media.uploaded 이벤트 수신 및 처리 파이프라인 실행
  @OnEvent('media.uploaded')
  async handleMediaUpload(payload: MediaUploadedEvent): Promise<void> {
    console.log('[media-pipeline.service]handleMediaUpload start');
    const { mediaId, s3Key, contentType, mimeType } = payload;
    console.log('[media-pipeline.service]payload : ', payload);
    console.log(
      `[media-pipeline.service]Starting process for Media ID: ${mediaId}, Type: ${contentType}`,
    );

    // 임시 스토리지 경로 설정
    const originalLocalPath = path.join(
      os.tmpdir(),
      `${mediaId}_original_${Date.now()}`,
    );
    console.log(
      '[media-pipeline.service]originalLocalPath : ',
      originalLocalPath,
    );
    try {
      // 상태 변경: PENDING -> PROCESSING
      await this.mediaRepository.update(mediaId, {
        status: ContentStatus.PROCESSING,
      });

      // Private S3에서 원본 파일 다운로드
      await this.s3UtilityService.downloadOriginal(s3Key, originalLocalPath);

      let processedUrls: ProcessedUrls;

      // 미디어 타입 분기 및 처리 실행
      if (contentType === ContentType.IMAGE) {
        // 이미지 처리: L, M, S 생성 및 Public S3 업로드 (sharp)
        processedUrls = await this.mediaProcessorService.processImage(
          originalLocalPath,
          mediaId,
          mimeType,
        );
      } else {
        // 비디오 처리: 트랜스코딩, 썸네일, 클립 생성 (FFmpeg)
        processedUrls = await this.mediaProcessorService.processVideo(
          originalLocalPath,
          mediaId,
        );
      }
      console.log('[media-pipeline.service]processedUrls : ', processedUrls);
      // DB URL 및 최종 상태 업데이트
      await this.mediaRepository.update(mediaId, {
        ...processedUrls,
        status: ContentStatus.ACTIVE,
      });

      this.logger.log(
        `[Pipeline] Successfully processed and set ACTIVE for Media ID: ${mediaId}`,
      );
    } catch (error) {
      // sharp/FFmpeg 또는 S3 처리 중 에러 발생
      this.logger.error(
        `[Pipeline Error] Failed to process Media ID: ${mediaId}`,
        error.stack,
      );

      // DB 상태를 FAILED로 업데이트 (재시도 또는 관리자 확인 필요)
      await this.mediaRepository.update(mediaId, {
        status: ContentStatus.FAILED,
      });
    } finally {
      // 임시 스토리지의 원본 파일 삭제
      try {
        await fsPromises.unlink(originalLocalPath);
      } catch (cleanupError) {
        console.error('[media-pipeline.service]cleanupError : ', cleanupError);
        this.logger.warn(
          `Failed to clean up local file ${originalLocalPath}: ${cleanupError.message}`,
        );
      }
    }
  }
}
