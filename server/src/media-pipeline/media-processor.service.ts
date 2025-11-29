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

// ProcessedUrls 인터페이스는 media_items 엔티티의 URL 컬럼과 일치해야 한다.
export interface ProcessedUrls {
  urlLarge?: string;
  urlMedium?: string;
  urlSmall?: string; // Thumbnail URL 포함
  urlVideoPlayback?: string;
  urlVideoPreview?: string;
}

const TEMP_DIR = os.tmpdir(); // 시스템의 임시 디렉토리 사용
const IMAGE_SIZES = { LARGE: 1920, MEDIUM: 1080, SMALL: 640 };
const VIDEO_PREVIEW_DURATION = 5; // 5 seconds

// FFmpeg 바이너리 경로 설정
ffmpeg.setFfmpegPath(ffmpegStatic.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

@Injectable()
export class MediaProcessorService {
  private readonly logger = new Logger(MediaProcessorService.name);

  constructor(private readonly s3UtilityService: S3UtilityService) {}

  // 이미지 리사이징 (L, M, S) 및 Public S3 업로드
  async processImage(
    localPath: string,
    mediaId: number,
    mimeType: string,
  ): Promise<ProcessedUrls> {
    console.log('[media-processor.service]processImage start.');

    const urls: ProcessedUrls = {};

    const uniqueFolderName = `${mediaId}_${Date.now()}`;
    const tempBaseKey = `media_items/${uniqueFolderName}`;
    const tempLocalDir = path.join(
      TEMP_DIR,
      `img_proc_${mediaId}_${Date.now()}`,
    );
    console.log('[media-processor.service]tempBaseKey : ', tempBaseKey);
    console.log('[media-processor.service]tempLocalDir : ', tempLocalDir);
    await fs.mkdir(tempLocalDir, { recursive: true });

    try {
      if (mimeType === 'image/gif' || mimeType === 'image/bmp') {
        throw new BadRequestException('지원하지 않는 형식입니다.');
      }

      const resizeTasks = Object.entries(IMAGE_SIZES).map(
        async ([key, size]) => {
          console.log('[media-processor.service]resize each files in map loop');
          const suffix = key.toLowerCase();
          const tempOutputPath = path.join(tempLocalDir, `${suffix}.jpg`);
          console.log('[media-processor.service]suffix : ', suffix);
          console.log(
            '[media-processor.service]tempOutputPath : ',
            tempOutputPath,
          );

          // 리사이징 및 로컬 저장
          await sharp(localPath)
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
          console.log('[media-processor.service]s3Key : ', s3Key);
          console.log('[media-processor.service]publicUrl : ', publicUrl);

          // URL 맵 업데이트
          if (suffix === 'large') urls.urlLarge = publicUrl;
          if (suffix === 'medium') urls.urlMedium = publicUrl;
          if (suffix === 'small') urls.urlSmall = publicUrl;
        },
      );
      console.log('[media-processor.service]urls : ', urls);

      await Promise.all(resizeTasks);
      return urls;
    } catch (error) {
      console.error(
        '[media-processor.service]error in resizing image. mediaId : ',
        mediaId,
      );
      console.error(error);
      // this.logger.error(
      //   `Image processing failed for Media ID ${mediaId}:`,
      //   error,
      // );
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
  ): Promise<ProcessedUrls> {
    console.log('[media-processor.service]processVideo start.');
    const urls: ProcessedUrls = {};
    const tempBaseKey = `processed/videos/${mediaId}`;
    const tempLocalDir = path.join(
      TEMP_DIR,
      `vid_proc_${mediaId}_${Date.now()}`,
    );
    console.log('[media-processor.service]tempBaseKey : ', tempBaseKey);
    console.log('[media-processor.service]tempLocalDir : ', tempLocalDir);
    await fs.mkdir(tempLocalDir, { recursive: true });

    const outputPaths = {
      playback: path.join(tempLocalDir, 'playback.mp4'),
      thumbnail: path.join(tempLocalDir, 'thumbnail.jpg'),
      preview: path.join(tempLocalDir, 'preview.mp4'),
    };
    console.log('[media-processor.service]outputPaths : ', outputPaths);
    try {
      const processingTasks: Promise<void>[] = [];

      // 트랜스코딩 (MP4)
      processingTasks.push(
        new Promise((resolve, reject) => {
          ffmpeg(localPath)
            .outputOptions([
              '-vcodec libx264',
              '-acodec aac',
              '-b:v 1000k',
              '-preset slow',
              '-crf 23',
              '-pix_fmt yuv420p',
            ])
            .on('end', () => resolve())
            .on('error', (err) =>
              reject(
                new InternalServerErrorException(
                  `Transcoding failed: ${err.message}`,
                ),
              ),
            )
            .save(outputPaths.playback);
        }),
      );

      // 썸네일 추출
      processingTasks.push(
        new Promise((resolve, reject) => {
          ffmpeg(localPath)
            .screenshots({
              timestamps: ['00:00:01.000'],
              filename: path.basename(outputPaths.thumbnail), // thumbnail.jpg
              folder: tempLocalDir,
              size: '640x?',
              count: 1,
            })
            .on('end', () => resolve())
            .on('error', (err) =>
              reject(
                new InternalServerErrorException(
                  `Thumbnail failed: ${err.message}`,
                ),
              ),
            );
        }),
      );

      // 미리보기 클립 생성 (5s Muted)
      processingTasks.push(
        new Promise((resolve, reject) => {
          ffmpeg(localPath)
            .outputOptions([
              '-ss 00:00:00.000',
              `-t ${VIDEO_PREVIEW_DURATION}`,
              '-an', // No audio (Muted)
              '-vcodec libx264',
              '-crf 28',
              '-preset ultrafast',
            ])
            .on('end', () => resolve())
            .on('error', (err) =>
              reject(
                new InternalServerErrorException(
                  `Preview clip failed: ${err.message}`,
                ),
              ),
            )
            .save(outputPaths.preview);
        }),
      );

      // 모든 처리 작업 완료 대기
      await Promise.all(processingTasks);

      // Public S3 업로드
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
      console.log('[media-processor.service]uploadResults : ', uploadResults);

      // URL 맵 업데이트
      urls.urlVideoPlayback = uploadResults[0];
      urls.urlSmall = uploadResults[1]; // urlSmall 컬럼을 썸네일 경로로 사용
      urls.urlVideoPreview = uploadResults[2];

      console.log('[media-processor.service]urls : ', urls);
      return urls;
    } catch (error) {
      console.error('[media-processor.service]error : ', error);
      // this.logger.error(
      //   `Video processing failed for Media ID ${mediaId}:`,
      //   error,
      // );
      throw error;
    } finally {
      // 생성된 임시 폴더 및 파일 삭제
      await fs
        .rm(tempLocalDir, { recursive: true, force: true })
        .catch(() => {});
    }
  }
}
