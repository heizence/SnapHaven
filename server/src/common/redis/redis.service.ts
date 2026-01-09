import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { GetMediaItemsReqDto } from 'src/media-items/dto/get-media-items.dto';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      db: 0,
      lazyConnect: true,
    });

    this.client.on('connect', () => this.logger.log('✅ Connected to Redis'));
    this.client.on('error', (err) => this.logger.error('❌ Redis Error:', err));

    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('🧹 Redis connection closed');
  }

  /******************* [추상화] 공통 처리 매서드 ******************/

  /**
   * 공통 Cache-Aside 로직
   * @param key 캐시 키
   * @param factory DB 조회 함수
   * @param ttl 만료 시간(초)
   * @param logLabel 로그 식별자
   */
  private async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number,
    logLabel: string,
  ): Promise<T> {
    const cached = await this.client.get(key);
    if (cached) {
      this.logger.log(`🚀 Redis Hit (${logLabel}): ${key}`);
      return JSON.parse(cached);
    }

    this.logger.log(`🏠 Redis Miss (${logLabel}): ${key}. Fetching from DB...`);
    const result = await factory();

    if (result) {
      await this.client.set(key, JSON.stringify(result), 'EX', ttl);
    }
    return result;
  }

  /**
   * 패턴을 이용한 일괄 삭제 로직 (상세 페이지 무효화용)
   */
  private async delByPattern(pattern: string): Promise<void> {
    const stream = this.client.scanStream({ match: pattern });

    stream.on('data', async (keys) => {
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    });
  }

  /******************* 데이터 조회 및 설정 (Public API) ******************/

  // 메인 피드 목록
  async getOrSetMediaList<T>(
    query: GetMediaItemsReqDto,
    factory: () => Promise<T>,
    currentUserId?: number,
    isFetchingMyUploads?: boolean,
  ): Promise<T> {
    const key = this.generateMediaKey(
      query,
      currentUserId,
      isFetchingMyUploads,
    );
    return this.getOrSet(key, factory, 300, 'Feed');
  }

  // 미디어 상세
  async getOrSetMediaDetail<T>(
    mediaId: number,
    userId: number | undefined,
    factory: () => Promise<T>,
  ): Promise<T> {
    const key = `media:detail:${mediaId}:u=${userId ?? 'guest'}`;
    return this.getOrSet(key, factory, 3600, 'MediaDetail');
  }

  // 앨범 상세
  async getOrSetAlbumDetail<T>(
    albumId: number,
    userId: number | undefined,
    factory: () => Promise<T>,
  ): Promise<T> {
    const key = `album:detail:${albumId}:u=${userId ?? 'guest'}`;
    return this.getOrSet(key, factory, 3600, 'AlbumDetail');
  }

  // 프로필 정보
  async getOrSetProfile<T>(
    userId: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    const key = `user:profile:${userId}`;
    return this.getOrSet(key, factory, 3600, 'Profile');
  }

  /******************* 데이터 캐시 삭제 (Public API) ******************/

  async delMediaDetailCache(mediaId: number): Promise<void> {
    await this.delByPattern(`media:detail:${mediaId}:*`);
  }

  async delAlbumDetailCache(albumId: number): Promise<void> {
    await this.delByPattern(`album:detail:${albumId}:*`);
  }

  async delProfileCache(userId: number): Promise<void> {
    await this.client.del(`user:profile:${userId}`);
  }

  /******************* 키 생성 헬퍼 (복잡한 것만 유지) ******************/

  private generateMediaKey(
    query: GetMediaItemsReqDto,
    currentUserId?: number,
    isFetchingMyUploads?: boolean,
  ): string {
    const {
      page = 1,
      sort = 'LATEST',
      type = 'ALL',
      tag = '',
      keyword = '',
    } = query;
    let key = `feed:s=${sort}:t=${type}:p=${page}`;
    if (tag) key += `:tag=${tag}`;
    if (keyword) key += `:kw=${keyword}`;
    if (isFetchingMyUploads) key += `:myUploads=${currentUserId}`;
    else if (currentUserId) key += `:user=${currentUserId}`;
    return key;
  }
}
