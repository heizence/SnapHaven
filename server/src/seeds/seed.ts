/**
 * 데이터 시딩 스크립트 (클라우드 비종속, 표준 PostgreSQL)
 *
 * 목적:
 *  - 현실적 "데이터 볼륨"을 주입해 스키마/쿼리를 검증하고, Phase 1(부하 측정)의 토대를 만든다.
 *  - 규모는 환경변수로 파라미터화 → 지금은 소량(기본값), Phase 1엔 대량으로 재사용.
 *
 * 실행: NODE_ENV=local npm run seed
 * 규모 조절 예: SEED_USERS=100000 SEED_STANDALONE_MEDIA=5000000 ... npm run seed
 *
 * 주의: 시작 시 관련 테이블을 TRUNCATE(RESTART IDENTITY)로 비운다. (멱등 재실행)
 */
import 'reflect-metadata';
import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';
import dataSource from '../data-source';
import { ContentStatus, ContentType } from '../common/enums';

// ----- 규모 설정 (env override) -----
const num = (key: string, def: number) => Number(process.env[key] ?? def);
const CFG = {
  users: num('SEED_USERS', 30),
  tags: num('SEED_TAGS', 40),
  albums: num('SEED_ALBUMS', 10),
  standaloneMedia: num('SEED_STANDALONE_MEDIA', 200),
  likes: num('SEED_LIKES', 600),
  collections: num('SEED_COLLECTIONS', 20),
  batchSize: num('SEED_BATCH', 1000),
};

// ----- 배치 bulk insert 헬퍼 -----
// pg 파라미터 한도(65535)를 넘지 않도록 행 단위로 청크 분할.
async function bulkInsert(
  table: string,
  columns: string[],
  rows: any[][],
  returning?: string,
): Promise<any[]> {
  if (rows.length === 0) return [];
  const cols = columns.length;
  const maxRowsByParam = Math.floor(60000 / cols);
  const chunkSize = Math.max(1, Math.min(CFG.batchSize, maxRowsByParam));
  const out: any[] = [];
  const colSql = columns.map((c) => `"${c}"`).join(', ');

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const params: any[] = [];
    const valuesSql = chunk
      .map((row, r) => {
        const ph = row.map((_, c) => `$${r * cols + c + 1}`);
        params.push(...row);
        return `(${ph.join(', ')})`;
      })
      .join(', ');
    const sql =
      `INSERT INTO ${table} (${colSql}) VALUES ${valuesSql}` +
      (returning ? ` RETURNING ${returning}` : '');
    const res = await dataSource.query(sql, params);
    if (returning) out.push(...res.map((x: any) => x[returning]));
  }
  return out;
}

function pickType(): ContentType {
  return faker.number.int({ min: 1, max: 100 }) <= 80
    ? ContentType.IMAGE
    : ContentType.VIDEO;
}

// 미디어 1건의 INSERT 행 생성 (컬럼 순서 고정)
function mediaRow(
  ownerId: number,
  albumId: number | null,
  isRepresentative: number,
): any[] {
  const type = pickType();
  const isImage = type === ContentType.IMAGE;
  const key = `media-items/${randomUUID()}`;
  return [
    ownerId, // owner_id
    albumId, // album_id
    type, // type
    faker.number.int({ min: 320, max: 4096 }), // width
    faker.number.int({ min: 320, max: 4096 }), // height
    faker.lorem.words({ min: 1, max: 3 }).slice(0, 30), // title
    faker.lorem.sentence().slice(0, 200), // description
    isRepresentative, // is_representative
    ContentStatus.ACTIVE, // status
    `${key}.${isImage ? 'jpg' : 'mp4'}`, // s3_key_original
    isImage ? `${key}_s.webp` : null, // key_image_small
    isImage ? `${key}_m.webp` : null, // key_image_medium
    isImage ? `${key}_l.webp` : null, // key_image_large
    isImage ? null : `${key}_play.mp4`, // key_video_playback
    isImage ? null : `${key}_prev.mp4`, // key_video_preview
    faker.date.past({ years: 1 }), // created_at (피드 정렬용 분산)
  ];
}
const MEDIA_COLS = [
  'owner_id',
  'album_id',
  'type',
  'width',
  'height',
  'title',
  'description',
  'is_representative',
  'status',
  's3_key_original',
  'key_image_small',
  'key_image_medium',
  'key_image_large',
  'key_video_playback',
  'key_video_preview',
  'created_at',
];

async function main() {
  await dataSource.initialize();
  console.log('🔌 DB 연결됨. 시딩 설정:', CFG);
  const t0 = Date.now();

  console.log('🧹 기존 데이터 TRUNCATE...');
  await dataSource.query(`
    TRUNCATE TABLE media_tags, user_media_likes, collection_media_items,
                   user_album_likes, album_tags, media_items, albums,
                   user_collections, tags, users
    RESTART IDENTITY CASCADE
  `);

  // 1) users
  const userRows = Array.from({ length: CFG.users }, (_, i) => [
    `user${i}_${faker.string.alphanumeric(5)}@example.com`.slice(0, 40),
    `u${i}_${faker.internet.username()}`.slice(0, 20),
  ]);
  const userIds = await bulkInsert('users', ['email', 'nickname'], userRows, 'id');
  console.log(`👤 users: ${userIds.length}`);

  // 2) tags (id는 수동 부여 bigint, name 고유 ≤20)
  const tagNames = new Set<string>();
  let guard = 0;
  while (tagNames.size < CFG.tags && guard++ < CFG.tags * 20) {
    tagNames.add(faker.word.noun().slice(0, 20).toLowerCase());
  }
  const tagRows = [...tagNames].map((name, i) => [i + 1, name]);
  await bulkInsert('tags', ['id', 'name'], tagRows);
  const tagIds = tagRows.map((r) => r[0]);
  console.log(`🏷️  tags: ${tagIds.length}`);

  // 3) albums
  const albumRows = Array.from({ length: CFG.albums }, () => [
    faker.helpers.arrayElement(userIds),
    faker.lorem.words({ min: 1, max: 3 }).slice(0, 30),
    ContentStatus.ACTIVE,
  ]);
  const albumIds = await bulkInsert(
    'albums',
    ['owner_id', 'title', 'status'],
    albumRows,
    'id',
  );
  console.log(`📚 albums: ${albumIds.length}`);

  // 4) media_items — 앨범 멤버 먼저, 그 다음 단독. 메타데이터를 병렬 추적.
  const mediaRowsData: any[][] = [];
  const mediaMeta: { albumId: number | null }[] = [];
  albumIds.forEach((albumId, idx) => {
    const ownerId = albumRows[idx][0];
    const members = faker.number.int({ min: 2, max: 5 });
    for (let m = 0; m < members; m++) {
      mediaRowsData.push(mediaRow(ownerId, albumId, m === 0 ? 1 : 0));
      mediaMeta.push({ albumId });
    }
  });
  for (let i = 0; i < CFG.standaloneMedia; i++) {
    mediaRowsData.push(mediaRow(faker.helpers.arrayElement(userIds), null, 1));
    mediaMeta.push({ albumId: null });
  }
  const mediaIds = await bulkInsert('media_items', MEDIA_COLS, mediaRowsData, 'id');
  console.log(`🖼️  media_items: ${mediaIds.length} (앨범멤버+단독)`);

  // 5) media_tags — 미디어당 1~4개 태그 (중복 제거)
  const mediaTagRows: any[][] = [];
  for (const mediaId of mediaIds) {
    const chosen = faker.helpers.arrayElements(
      tagIds,
      faker.number.int({ min: 1, max: 4 }),
    );
    for (const tagId of chosen) mediaTagRows.push([mediaId, tagId]);
  }
  await bulkInsert('media_tags', ['media_id', 'tag_id'], mediaTagRows);
  console.log(`🔗 media_tags: ${mediaTagRows.length}`);

  // 6) user_media_likes — 랜덤 (user, media) 쌍, 중복 제거
  const likeSet = new Set<string>();
  const likeRows: any[][] = [];
  let lguard = 0;
  while (likeRows.length < CFG.likes && lguard++ < CFG.likes * 5) {
    const userId = faker.helpers.arrayElement(userIds);
    const mediaId = faker.helpers.arrayElement(mediaIds);
    const k = `${userId}:${mediaId}`;
    if (likeSet.has(k)) continue;
    likeSet.add(k);
    likeRows.push([mediaId, userId, faker.date.past({ years: 1 })]);
  }
  await bulkInsert(
    'user_media_likes',
    ['media_id', 'user_id', 'created_at'],
    likeRows,
  );
  console.log(`❤️  user_media_likes: ${likeRows.length}`);

  // 7) collections + 멤버
  const collRows = Array.from({ length: CFG.collections }, () => [
    faker.helpers.arrayElement(userIds),
    faker.lorem.words({ min: 1, max: 2 }).slice(0, 30),
  ]);
  const collIds = await bulkInsert(
    'user_collections',
    ['user_id', 'name'],
    collRows,
    'id',
  );
  const collItemRows: any[][] = [];
  for (const collectionId of collIds) {
    const items = faker.helpers.arrayElements(
      mediaIds,
      faker.number.int({ min: 3, max: 10 }),
    );
    for (const mediaId of items)
      collItemRows.push([collectionId, mediaId, faker.date.past({ years: 1 })]);
  }
  await bulkInsert(
    'collection_media_items',
    ['collection_id', 'media_id', 'created_at'],
    collItemRows,
  );
  console.log(
    `📁 collections: ${collIds.length}, 멤버: ${collItemRows.length}`,
  );

  await dataSource.destroy();
  console.log(`✅ 시딩 완료 (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

main().catch((err) => {
  console.error('❌ 시딩 실패:', err);
  process.exit(1);
});
