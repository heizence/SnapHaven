import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm'; //  DataSource 를 사용하여 트랜잭션 관리
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { ContentStatus, ContentType } from 'src/common/enums';
import { TagsService } from 'src/tags/tags.service';
import { MediaUploadedEvent } from './events/media-uploaded.event';
import { v4 as uuidv4 } from 'uuid';
import { Album } from 'src/albums/entities/album.entity';
import { S3UtilityService } from './s3-utility.service';
import {
  MediaProcessorService,
  ProcessedKeys,
} from './media-processor.service';
import {
  GetMediaPresignedUrlReqDto,
  GetMediaPresignedUrlResDto,
} from 'src/upload/dto/get-presigned-url.dto';
import { AlbumsService } from 'src/albums/albums.service';
import { RequestFileProcessingReqDto } from 'src/upload/dto/request-file-processing.dto';
import {
  GetPresignedPartsReqDto,
  InitiateMultipartUploadReqDto,
  CompleteMultipartUploadReqDto,
  InitiateMultipartUploadResDto,
  EachPresignedPartDto,
} from 'src/upload/dto/multipart-upload.dto';

const MAX_RETRIES = 5;

@Injectable()
export class MediaPipelineService {
  private readonly logger = new Logger(MediaPipelineService.name);

  constructor(
    @InjectRepository(MediaItem)
    private readonly mediaItemRepository: Repository<MediaItem>,

    private readonly albumsService: AlbumsService,
    private readonly tagsService: TagsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource, // 트랜잭션을 위한 DataSource

    private readonly s3UtilityService: S3UtilityService,
    private readonly mediaProcessorService: MediaProcessorService,
  ) {}

  // 양 끝 공백 제거 및 금지 문자 제거
  private sanitizeTitle(title: string): string {
    return title
      .trim()
      .replace(/[\\/:*?"<>|]/g, '')
      .substring(0, 30);
  }

  // MIME 타입을 기반으로 ContentType을 결정
  private determineContentType(mimeType: string): ContentType {
    if (mimeType.startsWith('image/bmp') || mimeType.startsWith('image/tiff')) {
      // 압축률이 낮아 비효율적인 포맷은 여기서 즉시 차단
      throw new BadRequestException('지원하지 않는 형식입니다.');
    }
    if (mimeType.startsWith('image/')) return ContentType.IMAGE;
    if (mimeType.startsWith('video/')) return ContentType.VIDEO;

    throw new InternalServerErrorException('지원하지 않는 형식입니다.');
  }

  // 파일 업로드 준비(presigned url 발급 및 메타데이터 저장)
  async readyToUpload(
    ownerId: number,
    dto: GetMediaPresignedUrlReqDto,
  ): Promise<{
    message: string;
    data: GetMediaPresignedUrlResDto;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let albumId: number | undefined = undefined;
      const tagsArray = dto.tags || [];
      const tagEntities = await this.tagsService.findTagsByName(tagsArray);
      const isAlbum = dto.isAlbumUpload && dto.files.length > 1;

      const isMultipart =
        dto.files.length === 1 &&
        this.determineContentType(dto.files[0].type) === ContentType.VIDEO;

      // 1. 앨범 생성
      if (isAlbum) {
        const album = queryRunner.manager.create(Album, {
          ownerId,
          title: this.sanitizeTitle(dto.title),
          description: dto.description,
          tags: tagEntities,
        });
        const savedAlbum = await queryRunner.manager.save(album);
        albumId = savedAlbum.id;
      }
      // media-items/5b09098d-7981-48b7-81bd-8ef6a532bd55.mp4
      let resultUrls: any[] = [];
      let globalUploadId: string | undefined = undefined;
      if (isMultipart) {
        /**
         * [CASE 1] Multipart Upload (단일 영상)
         */
        const file = dto.files[0];
        const fileExtension = file.name.split('.').pop() || 'mp4';
        const s3Key = `media-items/${uuidv4()}.${fileExtension}`;

        // S3 Multipart 세션 시작 및 UploadId 발급
        const multipartSession =
          await this.s3UtilityService.createMultipartUpload(s3Key, file.type);
        globalUploadId = multipartSession.uploadId;

        // 조각 개수 계산 (프론트와 동일한 10MB 기준)
        const PART_SIZE = 10 * 1024 * 1024;
        const totalParts = Math.ceil(file.size / PART_SIZE);
        const partNumbers = Array.from({ length: totalParts }, (_, i) => i + 1);

        // 각 조각별 Presigned URL 발급
        const urls = await Promise.all(
          partNumbers.map(async (partNumber) => {
            const url = await this.s3UtilityService.getPresignedPartUrl(
              globalUploadId!,
              s3Key,
              partNumber,
            );
            return { partNumber, url, s3Key };
          }),
        );

        resultUrls = urls;

        // DB 레코드 생성 (PENDING 상태)
        const mediaItem = queryRunner.manager.create(MediaItem, {
          ownerId,
          albumId,
          title: this.sanitizeTitle(dto.title),
          description: dto.description,
          isRepresentative: 1,
          type: ContentType.VIDEO,
          s3KeyOriginal: s3Key,
          tags: tagEntities,
          status: ContentStatus.PENDING,
          width: file.width,
          height: file.height,
          mimeType: file.type, // 재처리를 위해 mimeType 저장 권장
        });
        await queryRunner.manager.save(MediaItem, mediaItem);
      } else {
        // 2. Presigned URL 준비 + MediaItem 데이터 준비 (병렬)
        const fileMetaList = await Promise.all(
          dto.files.map(async (file, index) => {
            const contentType = this.determineContentType(file.type);
            const fileExtension = file.name.split('.').pop() || 'dat';
            const s3Key = `media-items/${uuidv4()}.${fileExtension}`;

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
                isRepresentative: index === 0 ? 1 : undefined,
                type: contentType,
                s3KeyOriginal: s3Key,
                tags: tagEntities,
                status: ContentStatus.PENDING,
                width: file.width,
                height: file.height,
              },
            };
          }),
        );

        resultUrls = fileMetaList.map((meta) => ({
          fileIndex: meta.index,
          signedUrl: meta.signedUrl,
          s3Key: meta.s3Key,
        }));

        // 3. DB Bulk Insert
        const mediaItems = fileMetaList.map((meta) =>
          queryRunner.manager.create(MediaItem, meta.mediaItemData),
        );
        await queryRunner.manager.save(MediaItem, mediaItems);
        await queryRunner.commitTransaction();
      }

      const data = {
        urls: resultUrls,
        albumId,
        isMultipart,
        uploadId: globalUploadId,
      };

      return {
        message: '업로드 준비 및 Presigned Url 발급 완료',
        data,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('URL 발급 및 DB 레코드 생성 실패');
    } finally {
      await queryRunner.release();
    }
  }

  // 클라이언트에서 s3 key 를 보내줬을 때 이후 파일 처리 작업 진행
  async requestFileProcessing(
    ownerId: number,
    dto: RequestFileProcessingReqDto,
  ): Promise<{ message: string }> {
    const { s3Keys, albumId } = dto;

    // [DB 조회] 클라이언트가 업로드 완료를 알린 S3 Key를 기반으로 PENDING 레코드를 조회
    const mediaItems = await this.mediaItemRepository.find({
      where: {
        s3KeyOriginal: In(s3Keys), // S3 키 목록에 포함되는지 확인
        status: ContentStatus.PENDING,
        ownerId: ownerId,
        albumId: albumId || undefined,
      },
    });

    // [유효성 검사] PENDING 상태의 레코드가 하나도 없거나 키가 불일치 시 에러
    if (mediaItems.length === 0) {
      throw new BadRequestException(
        '완료할 유효한 PENDING 상태의 미디어 항목을 찾을 수 없습니다.',
      );
    }

    await this.mediaItemRepository.update(
      { id: In(mediaItems.map((item) => item.id)) },
      { status: ContentStatus.PROCESSING },
    );

    for (const item of mediaItems) {
      try {
        this.eventEmitter.emit('media.uploaded', {
          mediaId: item.id,
          s3Key: item.s3KeyOriginal,
          mimeType:
            item.type === ContentType.IMAGE ? 'image/jpeg' : 'video/mp4',
          contentType: item.type,
        });
      } catch (error) {
        this.logger.error(
          '[Pipeline Error]failed to execute process. MediaId : ',
          item.id,
        );
        await this.mediaItemRepository.update(item.id, {
          status: ContentStatus.FAILED,
        });
      }
    }

    return { message: '파일 백그라운드 처리 중' };
  }

  /******************** 영상 파일 multipart 업로드 처리 ******************/
  async initiateMultipart(dto: InitiateMultipartUploadReqDto): Promise<{
    message: string;
    data: InitiateMultipartUploadResDto;
  }> {
    try {
      const data = await this.s3UtilityService.createMultipartUpload(
        dto.s3Key,
        dto.contentType,
      );

      return {
        message: '영상 multipart 업로드 준비 및 Presigned Url 발급 완료',
        data,
      };
    } catch (error) {
      console.error('[initiateMultipart]error : ', error);
      throw new InternalServerErrorException('멀티파트 업로드 시작 실패');
    }
  }

  async getPresignedParts(query: GetPresignedPartsReqDto): Promise<{
    message: string;
    urls: EachPresignedPartDto[];
  }> {
    try {
      const { uploadId, s3Key, partNumbers } = query;
      const partNumbersArr = partNumbers.split(',').map(Number);

      const urls = await Promise.all(
        partNumbersArr.map(async (partNumber) => {
          const url = await this.s3UtilityService.getPresignedPartUrl(
            uploadId,
            s3Key,
            partNumber,
          );
          return { partNumber, url };
        }),
      );

      return {
        message: '업로드 준비 및 Presigned Url 발급 완료',
        urls,
      };
    } catch (error) {
      console.error('[getPresignedParts]error : ', error);
      throw new InternalServerErrorException('조각 URL 발급 실패');
    }
  }

  async completeMultipart(dto: CompleteMultipartUploadReqDto): Promise<{
    message: string;
    s3Key: string;
  }> {
    try {
      await this.s3UtilityService.completeMultipartUpload(
        dto.uploadId,
        dto.s3Key,
        dto.parts,
      );
      return { message: '업로드 및 병합 완료', s3Key: dto.s3Key };
    } catch (error) {
      console.error('[completeMultipart]error : ', error);
      throw new InternalServerErrorException('멀티파트 병합 실패');
    }
  }

  // [비동기 워커] media.uploaded 이벤트 수신 및 처리 파이프라인 실행
  @OnEvent('media.uploaded')
  async handleMediaUpload(payload: MediaUploadedEvent): Promise<void> {
    const { mediaId, s3Key, contentType, mimeType } = payload;

    let attempt = 1;
    while (attempt <= MAX_RETRIES) {
      // 임시 스토리지 경로 설정
      const originalLocalPath = path.join(
        os.tmpdir(),
        `${mediaId}_original_${Date.now()}`,
      );

      try {
        // Private S3에서 원본 파일 다운로드
        await this.s3UtilityService.downloadOriginal(s3Key, originalLocalPath);

        let processedkeys: ProcessedKeys;

        // 미디어 타입 분기 및 처리 실행
        if (contentType === ContentType.IMAGE) {
          // 이미지 처리: L, M, S 생성 및 Public S3 업로드 (sharp)
          processedkeys = await this.mediaProcessorService.processImage(
            originalLocalPath,
            mediaId,
            mimeType,
          );
        } else {
          // 비디오 처리: 트랜스코딩, 썸네일, 클립 생성 (FFmpeg)
          processedkeys = await this.mediaProcessorService.processVideo(
            originalLocalPath,
            mediaId,
          );
        }

        // DB URL 및 최종 상태 업데이트
        await this.mediaItemRepository.update(mediaId, {
          ...processedkeys,
          status: ContentStatus.ACTIVE,
        });
        break; // 성공 시 종료
      } catch (error) {
        // DB 상태를 FAILED로 업데이트
        if (attempt === MAX_RETRIES) {
          await this.mediaItemRepository.update(mediaId, {
            status: ContentStatus.FAILED,
          });
          break;
        } else {
          await new Promise((res) => setTimeout(res, 1000 * attempt));
          attempt++;
        }
      } finally {
        try {
          if (fs.existsSync(originalLocalPath)) {
            // 파일이 존재하는지 먼저 확인
            await fsPromises.unlink(originalLocalPath);
          }
        } catch (cleanupError) {
          this.logger.error(
            '[media-pipeline.service]cleanupError : ',
            cleanupError,
          );
          this.logger.warn(
            `Failed to clean up local file ${originalLocalPath}: ${cleanupError.message}`,
          );
        }
      }
    }
  }
}
