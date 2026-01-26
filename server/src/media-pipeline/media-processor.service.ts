import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { S3UtilityService } from './s3-utility.service';
import * as sharp from 'sharp';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffprobeStatic from '@ffprobe-installer/ffprobe';
import * as ffmpegStatic from '@ffmpeg-installer/ffmpeg';

import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { ContentStatus } from 'src/common/enums';
import { Repository } from 'typeorm';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { InjectRepository } from '@nestjs/typeorm';

// ProcessedKeys 인터페이스는 media_items 엔티티의 URL 컬럼과 일치해야 한다.

export interface ProcessedKeys {
  keyImageLarge?: string;
  keyImageMedium?: string;
  keyImageSmall?: string; // Thumbnail URL 포함
  keyVideoPlayback?: string;
  keyVideoPreview?: string;
}

const TEMP_DIR = os.tmpdir(); // 시스템의 임시 디렉토리 사용
const IMAGE_SIZES = { LARGE: 1920, MEDIUM: 1080, SMALL: 640 };
const VIDEO_PREVIEW_DURATION = 5; // 5 seconds

// FFmpeg 바이너리 경로 설정
ffmpeg.setFfmpegPath(ffmpegStatic.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

sharp.cache(false); // 캐시를 비활성화하여 비정상 데이터 처리에 따른 간섭 방지
sharp.concurrency(1); // 개별 프로세스 내 병렬성을 제한하여 안정성 확보 (필요 시)

@Injectable()
export class MediaProcessorService {
  private readonly logger = new Logger(MediaProcessorService.name);

  constructor(
    private readonly s3UtilityService: S3UtilityService,
    @InjectRepository(MediaItem)
    private readonly mediaItemRepository: Repository<MediaItem>,
  ) {}

  // 이미지 리사이징 (L, M, S) 및 Public S3 업로드
  async processImage(
    localPath: string,
    mediaId: number,
    mimeType: string,
  ): Promise<ProcessedKeys> {
    const keys: ProcessedKeys = {};

    const uniqueFolderName = `${mediaId}_${Date.now()}`;
    const tempBaseKey = `media-items/${uniqueFolderName}`;
    const tempLocalDir = path.join(
      TEMP_DIR,
      `img_proc_${mediaId}_${Date.now()}`,
    );
    await fs.mkdir(tempLocalDir, { recursive: true });

    try {
      if (mimeType === 'image/gif' || mimeType === 'image/bmp') {
        throw new BadRequestException('지원하지 않는 형식입니다.');
      }

      const resizeTasks = Object.entries(IMAGE_SIZES).map(
        async ([key, size]) => {
          const suffix = key.toLowerCase();
          const tempOutputPath = path.join(tempLocalDir, `${suffix}.jpg`);

          // 리사이징 및 로컬 저장
          await sharp(localPath, { failOn: 'none' })
            .resize(size, size, {
              fit: sharp.fit.inside,
              withoutEnlargement: true,
            })
            .toFile(tempOutputPath);

          // Public S3 업로드
          const s3Key = `${tempBaseKey}/${suffix}.jpg`;
          const publicUrl = await this.s3UtilityService.uploadProcessedFile(
            tempOutputPath,
            s3Key,
            'image/jpeg',
          );

          // URL 맵 업데이트
          if (suffix === 'large') keys.keyImageLarge = publicUrl;
          if (suffix === 'medium') keys.keyImageMedium = publicUrl;
          if (suffix === 'small') keys.keyImageSmall = publicUrl;
        },
      );

      await Promise.all(resizeTasks);
      return keys;
    } catch (error) {
      this.logger.error(
        `[media-processor.service]error in resizing image. mediaId : ${mediaId}`,
      );
      this.logger.error(error);

      await this.mediaItemRepository.update(mediaId, {
        status: ContentStatus.FAILED,
      });

      throw new InternalServerErrorException(
        'Image resizing and S3 upload failed.',
      );
    } finally {
      // 생성된 임시 폴더 및 파일 삭제
      await fs
        .rm(tempLocalDir, { recursive: true, force: true })
        .catch(() => {});
    }
  }

  // 비디오 트랜스코딩, 썸네일, 미리보기 클립 생성 및 S3 업로드
  async processVideo(
    localPath: string,
    mediaId: number,
  ): Promise<ProcessedKeys> {
    this.logger.log(
      `[Processor] 비디오 가공 프로세스 진입 | MediaId: ${mediaId}`,
    );
    const startAt = Date.now();
    const keys: ProcessedKeys = {};
    const uniqueFolderName = `${mediaId}_${Date.now()}`;
    const tempBaseKey = `media-items/${uniqueFolderName}`;
    const tempLocalDir = path.join(
      TEMP_DIR,
      `vid_proc_${mediaId}_${Date.now()}`,
    );
    await fs.mkdir(tempLocalDir, { recursive: true });

    const outputPaths = {
      playback: path.join(tempLocalDir, 'playback.mp4'),
      thumbnail: path.join(tempLocalDir, 'thumbnail.jpg'),
      preview: path.join(tempLocalDir, 'preview.mp4'),
    };

    try {
      // Task 1: 트랜스코딩(mp4)
      this.logger.log(
        `[Processor] [Step 1] 트랜스코딩 시작 (threads 1, ultrafast)`,
      );
      await new Promise<void>((resolve, reject) => {
        ffmpeg(localPath)
          .outputOptions([
            '-vcodec libx264',
            '-acodec aac',
            '-b:v 1000k',
            '-preset ultrafast',
            '-crf 23',
            '-threads 1',
          ])
          .on('end', () => {
            this.logger.log(`[Processor] [Task 1] 트랜스코딩 완료`);
            resolve();
          })
          .on('error', (err) => reject(err))
          .save(outputPaths.playback);
      });

      // Task 2: 썸네일 추출 (상대적으로 가벼움)
      this.logger.log(`[Processor] [Step 2] 썸네일 추출 시작`);
      await new Promise<void>((resolve, reject) => {
        ffmpeg(localPath)
          .screenshots({
            timestamps: ['00:00:01.000'],
            filename: path.basename(outputPaths.thumbnail),
            folder: tempLocalDir,
            size: '640x?',
          })
          .on('end', () => {
            this.logger.log(`[Processor] [Task 2] 썸네일 추출 완료`);
            resolve();
          })
          .on('error', (err) => reject(err));
      });
      // Task 3: 미리보기 클립 생성
      this.logger.log(`[Processor] [Step 3] 미리보기 생성 시작`);
      await new Promise<void>((resolve, reject) => {
        ffmpeg(localPath)
          .outputOptions([
            '-ss 00:00:00.000',
            `-t ${VIDEO_PREVIEW_DURATION}`,
            '-an',
            '-vcodec libx264',
            '-preset ultrafast',
            '-threads 1',
          ])
          .on('end', () => {
            this.logger.log(`[Processor] [Task 3] 미리보기 생성 완료`);
            resolve();
          })
          .on('error', (err) => reject(err))
          .save(outputPaths.preview);
      });

      this.logger.log(
        `[Processor] 모든 가공 완료. 소요시간: ${((Date.now() - startAt) / 1000).toFixed(2)}s`,
      );

      // Public S3 업로드
      this.logger.log(`[Processor] 가공 파일 S3 업로드 시작...`);
      const uploadResults = await Promise.all([
        this.s3UtilityService.uploadProcessedFile(
          outputPaths.playback,
          `${tempBaseKey}/playback.mp4`,
          'video/mp4',
        ),
        this.s3UtilityService.uploadProcessedFile(
          outputPaths.thumbnail,
          `${tempBaseKey}/thumbnail.jpg`,
          'image/jpeg',
        ),
        this.s3UtilityService.uploadProcessedFile(
          outputPaths.preview,
          `${tempBaseKey}/preview.mp4`,
          'video/mp4',
        ),
      ]);
      this.logger.log(`[Processor] S3 업로드 완료`);

      // URL 맵 업데이트
      keys.keyVideoPlayback = uploadResults[0];
      keys.keyImageSmall = uploadResults[1]; // keyImageSmall 컬럼을 썸네일 경로로 사용
      keys.keyVideoPreview = uploadResults[2];

      return keys;
    } catch (error) {
      this.logger.error(
        '[media-processor.service Error]error in processing video. MediaId : ',
        mediaId,
      );
      this.logger.error('[media-processor.service] : ', error);

      await this.mediaItemRepository.update(mediaId, {
        status: ContentStatus.FAILED,
      });

      throw error;
    } finally {
      // 생성된 임시 폴더 및 파일 삭제
      await fs
        .rm(tempLocalDir, { recursive: true, force: true })
        .catch(() => {});
      this.logger.log(
        `[Processor] 임시 작업 디렉토리 삭제 완료: ${tempLocalDir}`,
      );
    }
  }
}
