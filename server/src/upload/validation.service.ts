import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ContentType } from 'src/common/enums';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffprobeStatic from '@ffprobe-installer/ffprobe';
import { S3UtilityService } from 'src/media-pipeline/s3-utility.service';
import * as fsPromises from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

@Injectable()
export class ValidationService {
  private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly MAX_VIDEO_DURATION = 60; // 60초

  private readonly ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
  private readonly ALLOWED_VIDEO_EXTENSIONS = [
    'mp4',
    'mov',
    'm4v',
    'webm',
    'mkv',
  ];

  private readonly ALLOWED_IMAGE_MIME = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  private readonly ALLOWED_VIDEO_MIME = [
    'video/mp4',
    'video/quicktime', // mov
    'video/webm',
    'video/x-matroska', // mkv
  ];

  constructor(private readonly s3UtilityService: S3UtilityService) {
    // ffprobe 바이너리 경로 설정
    ffmpeg.setFfprobePath(ffprobeStatic.path);
  }

  private validateFileType(
    file: Express.Multer.File,
    contentType: ContentType,
  ) {
    const originalName = file.originalname.toLowerCase();
    const extension = originalName.split('.').pop();

    const mime = file.mimetype;

    const allowedExt =
      contentType === ContentType.IMAGE
        ? this.ALLOWED_IMAGE_EXTENSIONS
        : this.ALLOWED_VIDEO_EXTENSIONS;

    const allowedMime =
      contentType === ContentType.IMAGE
        ? this.ALLOWED_IMAGE_MIME
        : this.ALLOWED_VIDEO_MIME;

    // 확장자 검사
    if (!extension || !allowedExt.includes(extension)) {
      throw new BadRequestException(
        `허용되지 않은 파일 형식입니다. (${allowedExt.join(', ')})`,
      );
    }

    // MIME 검사
    if (!allowedMime.includes(mime)) {
      throw new BadRequestException(
        `파일 MIME 타입이 올바르지 않습니다. (${allowedMime.join(', ')})`,
      );
    }
  }

  // 최대 파일 갯수 검증, 각 파일 최대 용량 검증
  validateFileArray(
    files: Express.Multer.File[],
    contentType: ContentType,
    maxCount: number,
  ) {
    console.log('[validation.service]validateFileArray start');
    console.log('[validation.service]files : ', files);
    console.log('[validation.service]contentType : ', contentType);
    console.log('[validation.service]maxCount : ', maxCount);
    if (!files || files.length === 0) {
      throw new BadRequestException('업로드할 파일이 없습니다.');
    }
    if (files.length > maxCount) {
      throw new BadRequestException(
        `최대 ${maxCount}개 파일까지만 업로드 가능합니다.`,
      );
    }

    const maxSize =
      contentType === ContentType.IMAGE
        ? this.MAX_IMAGE_SIZE
        : this.MAX_VIDEO_SIZE;

    console.log('[validation.service]maxSize : ', maxSize);
    for (const file of files) {
      this.validateFileType(file, contentType);
      if (file.size > maxSize) {
        // 413 Payload Too Large 대신 400 BadRequest 사용 (Multer에서 이미 413을 던졌을 수도 있음)
        throw new BadRequestException(
          `파일 크기가 최대 제한 (${maxSize / (1024 * 1024)}MB)을 초과했습니다.`,
        );
      }
    }
  }

  // 비디오 길이 검증(60초 이하)
  async validateVideoDuration(file: Express.Multer.File) {
    console.log('[validation.service]validateVideoDuration start.');
    console.log('[validation.service]file : ', file);
    //const filePath = file.path || file.filename;

    const s3Key = (file as any).key;
    console.log('[validation.service]s3Key : ', s3Key);
    const originalName = file.originalname;

    if (!s3Key) {
      throw new InternalServerErrorException(
        'S3 키가 누락되어 비디오 길이를 검증할 수 없습니다.',
      );
    }

    // 1. EC2 호스트의 임시 다운로드 경로 설정
    const tempLocalPath = path.join(
      os.tmpdir(),
      `ffprobe_vid_${Date.now()}_${originalName}`,
    );
    let isDownloaded = false;

    try {
      await this.s3UtilityService.downloadOriginal(s3Key, tempLocalPath); // [!code focus]
      isDownloaded = true;

      // fluent-ffmpeg의 ffprobe 기능을 Promise로 래핑하여 사용
      const metadata: any = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(tempLocalPath, (err, metadata) => {
          if (err) {
            return reject(err);
          }
          resolve(metadata);
        });
      });
      console.log('[validation.service]metadata : ', metadata);

      const durationSeconds = metadata?.format?.duration
        ? parseFloat(metadata.format.duration)
        : 0;

      console.log('[validation.service]durationSeconds : ', durationSeconds);

      if (isNaN(durationSeconds) || durationSeconds <= 0) {
        throw new BadRequestException(
          '유효한 비디오 파일이 아니거나 메타데이터를 읽을 수 없습니다.',
        );
      }

      if (durationSeconds > this.MAX_VIDEO_DURATION) {
        // 60초 초과 시 에러 발생
        throw new BadRequestException(
          `비디오 길이가 최대 제한 (${this.MAX_VIDEO_DURATION}초)을 초과했습니다.`,
        );
      }
    } catch (e: any) {
      // 오류 발생 시(FFprobe 오류, S3 오류 등)
      console.error(`FFprobe execution error for ${file.originalname}:`, e);

      // BadRequestException은 그대로 throw, 다른 에러는 InternalServerException으로 변환
      if (e instanceof BadRequestException) throw e;
      throw new InternalServerErrorException(
        '비디오 검증 시스템 실행 중 오류가 발생했습니다.',
      );
    } finally {
      // 다운로드된 임시 파일 삭제
      if (isDownloaded) {
        try {
          await fsPromises.unlink(tempLocalPath);
        } catch (e) {
          console.warn(`Failed to clean up local file ${tempLocalPath}`);
        }
      }
    }
  }
}
