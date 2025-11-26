import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ContentType } from 'src/common/enums';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffprobeStatic from '@ffprobe-installer/ffprobe';

@Injectable()
export class ValidationService {
  private readonly MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
  private readonly MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
  private readonly MAX_VIDEO_DURATION = 60; // 60초

  constructor() {
    // ffprobe 바이너리 경로 설정
    ffmpeg.setFfprobePath(ffprobeStatic.path);
  }

  // 최대 파일 갯수 검증
  validateFileArray(
    files: Express.Multer.File[],
    contentType: ContentType,
    maxCount: number,
  ) {
    console.log('[validation.servide]validateFileArray start');
    console.log('[validation.servide]files : ', files);
    console.log('[validation.servide]contentType : ', contentType);
    console.log('[validation.servide]maxCount : ', maxCount);
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

    console.log('[validation.servide]maxSize : ', maxSize);
    for (const file of files) {
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
    console.log('[validation.servide]validateVideoDuration start.');
    console.log('[validation.servide]file : ', file);
    const filePath = file.path || file.filename;
    console.log('[validation.servide]filePath : ', filePath);

    if (!filePath) {
      throw new InternalServerErrorException(
        '파일 경로를 찾을 수 없어 비디오 길이를 검증할 수 없습니다.',
      );
    }

    try {
      // fluent-ffmpeg의 ffprobe 기능을 Promise로 래핑하여 사용
      const metadata: any = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) {
            return reject(err);
          }
          resolve(metadata);
        });
      });
      console.log('[validation.servide]metadata : ', metadata);

      const durationSeconds = metadata?.format?.duration
        ? parseFloat(metadata.format.duration)
        : 0;

      console.log('[validation.servide]durationSeconds : ', durationSeconds);

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
      // FFprobe 실행 또는 파일 접근 오류
      console.error(`FFprobe execution error for ${file.originalname}:`, e);
      throw new InternalServerErrorException(
        '비디오 검증 시스템 실행 중 오류가 발생했습니다.',
      );
    }
  }
}
