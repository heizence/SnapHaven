import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, LessThan, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from 'src/users/entities/user.entity';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { ContentStatus, ContentType } from 'src/common/enums';
import { S3UtilityService } from 'src/media-pipeline/s3-utility.service';

@Injectable()
export class BackgroundTasksService {
  private readonly logger = new Logger(BackgroundTasksService.name);

  constructor(
    private dataSource: DataSource,
    private eventEmitter: EventEmitter2,
    private s3Service: S3UtilityService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleHardDelete() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 30일 경과 탈퇴 회원 삭제 대상 조회
      const expiredUsers = await queryRunner.manager.find(User, {
        where: { deletedAt: LessThan(thirtyDaysAgo) },
        withDeleted: true,
      });

      if (expiredUsers.length > 0) {
        const userIds = expiredUsers.map((u) => u.id);

        // 유저 삭제
        await queryRunner.manager.delete(User, { id: In(userIds) });
        this.logger.log(`[Cron] 탈퇴 회원 ${userIds.length}명 영구 삭제 완료`);
      }

      // 30일 경과 삭제된 미디어(MediaItem) S3 리소스 및 DB 정리
      const expiredMedia = await queryRunner.manager.find(MediaItem, {
        where: {
          status: ContentStatus.DELETED,
          deletedAt: LessThan(thirtyDaysAgo),
        },
        withDeleted: true,
      });

      if (expiredMedia.length > 0) {
        // S3 Key 수집
        const keysToDelete = expiredMedia
          .flatMap((m) => [
            m.s3KeyOriginal,
            m.keyImageSmall,
            m.keyImageMedium,
            m.keyImageLarge,
            m.keyVideoPreview,
            m.keyVideoPlayback,
          ])
          .filter(Boolean);

        // S3 실제 파일 삭제
        if (keysToDelete.length > 0) {
          await this.s3Service.deleteObjects(keysToDelete);
        }

        // DB 레코드 삭제
        await queryRunner.manager.delete(MediaItem, {
          id: In(expiredMedia.map((t) => t.id)),
        });

        this.logger.log(
          `[Cron] 미디어 리소스 ${expiredMedia.length}건 영구 삭제 완료`,
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('[Cron] 데이터 청소 중 에러 발생:', error);
    } finally {
      await queryRunner.release();
    }
  }
  /**
   * 업로드 실패(PENDING) 및 방치된 FAILED 데이터 정리
   * 24시간 동안 변화가 없는 PENDING/FAILED 데이터를 정리하여 스토리지를 최적화
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleStalledUploads() {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const mediaRepository = this.dataSource.getRepository(MediaItem);

    // 24시간 이상 방치된 PENDING(업로드 미완료) 또는 FAILED(변환 실패) 조회
    const stalledItems = await mediaRepository.find({
      where: [
        { status: ContentStatus.PENDING, createdAt: LessThan(oneDayAgo) },
        { status: ContentStatus.FAILED, createdAt: LessThan(oneDayAgo) },
      ],
    });

    if (stalledItems.length === 0) return;

    for (const item of stalledItems) {
      if (!item.s3KeyOriginal) {
        this.logger.warn(
          `[Cron] Media ID ${item.id}은 원본 S3 키가 없어 재처리가 불가능합니다. (삭제 검토 필요)`,
        );
        continue;
      }

      // 파이프라인 이벤트 재발행
      // media-pipeline.service.ts의 @OnEvent('media.uploaded')가 이 이벤트를 수신
      this.eventEmitter.emit('media.uploaded', {
        mediaId: item.id,
        s3Key: item.s3KeyOriginal,
        contentType: item.type,
        mimeType: item.type === ContentType.IMAGE ? 'image/jpeg' : 'video/mp4',
      });

      this.logger.log(`[Cron] Media ID ${item.id} 재처리 이벤트 발행 완료`);
    }
  }
}
