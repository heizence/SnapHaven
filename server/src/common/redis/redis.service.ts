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
    // 커서(lastId)가 있다는 것은 추가 데이터를 불러오는 중임을 의미
    // 무한 스크롤 깊은 지점의 데이터는 캐싱 효율이 낮으므로 DB에서 직접 가져온다
    if (query.lastId) {
      return await factory();
    }

    // 첫 페이지 요청인 경우에만 캐시 로직을 수행
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
    const key = `media:detail:${mediaId}:user=${userId ?? 'guest'}`;
    return this.getOrSet(key, factory, 3600, 'MediaDetail');
  }

  // 앨범 상세
  async getOrSetAlbumDetail<T>(
    albumId: number,
    userId: number | undefined,
    factory: () => Promise<T>,
  ): Promise<T> {
    const key = `album:detail:${albumId}:user=${userId ?? 'guest'}`;
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
  // 특정 사용자의 모든 피드 목록 캐시 삭제
  async delUserFeedsCache(userId: number): Promise<void> {
    const pattern = `feed:*:user=${userId}`;
    await this.delByPattern(pattern);
  }

  // 특정 사용자의 특정 콘텐츠 상세 페이지 캐시 삭제
  async delUserMediaDetailCache(
    mediaId: number,
    userId: number,
  ): Promise<void> {
    const key = `media:detail:${mediaId}:user=${userId ?? 'guest'}`;
    await this.client.del(key);
  }

  // 특정 사용자의 특정 앨범 상세 페이지 캐시 삭제
  async delUserAlbumDetailCache(
    albumId: number,
    userId: number,
  ): Promise<void> {
    await this.delByPattern(
      `album:detail:${albumId}:user=${userId ?? 'guest'}`,
    );
  }

  /*** 아래 매서드들은 특정 콘텐츠가 수정, 삭제되었을 때 사용(전체 사용자들에게 반영해 줄 필요가 있을 때) ***/
  async delMediaListCache(): Promise<void> {
    // feed:s=LATEST:t=ALL... 등 모든 목록 캐시 무효화
    await this.delByPattern('feed:*');
  }

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
    const { sort = 'LATEST', type = 'ALL', tag = '', keyword = '' } = query;

    // first 라는 식별자를 사용하여 첫 페이지임을 명시
    let key = `feed:first:s=${sort}:t=${type}`;

    if (tag) key += `:tag=${tag}`;
    if (keyword) key += `:kw=${keyword}`;

    // 내 업로드와 일반 피드 구분
    if (isFetchingMyUploads) {
      key += `:my=${currentUserId}`;
    } else if (currentUserId) {
      // 로그인 사용자의 경우 '좋아요' 여부가 포함되므로 사용자별 키 생성
      key += `:u=${currentUserId}`;
    } else {
      key += `:u=guest`;
    }

    return key;
  }
}
