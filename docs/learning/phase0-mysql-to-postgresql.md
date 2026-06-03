# Phase 0-A — MySQL → PostgreSQL 전환 (학습 노트)

> 목표: SnapHaven 백엔드의 DB를 MySQL에서 PostgreSQL로 전환하면서, 두 RDBMS의
> 차이로 인해 발생하는 문제들을 **실제로 마주치고 원인을 분석한 뒤 해결**한다.
> 클라우드 비종속(표준 Postgres)으로 작업하여 추후 어떤 호스팅(Oracle/Fly/그 외)
> 으로도 이동 가능하게 유지한다.

이 문서는 "무엇을 바꿨나"가 아니라 **"왜 그렇게 동작하고, 왜 그렇게 고쳤나"**를 설명한다.

---

## 0. 작업 범위 요약

| 구분 | 내용 |
|---|---|
| DB 드라이버 | `mysql2` 제거 → `pg` 추가, TypeORM `type: 'mysql' → 'postgres'` |
| 스키마 관리 | `synchronize:false` 수동 관리 → **TypeORM 마이그레이션 정식 도입** |
| 엔티티 타입 | `bigint` FK→`int`, `tinyint`→`smallint`, enum 공유(`enumName`) |
| 쿼리 | `LIKE`→`ILIKE`, alias 정렬→집계식 정렬 |
| 조인 테이블 | `created_at` 컬럼 누락 보강(수동 마이그레이션) |
| 로컬 환경 | 호스트 네이티브 PG/Redis 충돌 회피(컨테이너 5433/6380) |

검증: 빌드 + 단위테스트 + 공개/인증 엔드포인트 전수 스모크.

---

## 1. FK ↔ PK 타입 정합성 — MySQL은 관대하고 PostgreSQL은 엄격하다

### 개념
외래 키(FK)는 "참조하는 컬럼"과 "참조되는 컬럼(PK)"의 **타입이 호환**되어야 한다.
- **MySQL**: `BIGINT` 컬럼이 `INT` PK를 참조해도 (느슨하게) 허용한다.
- **PostgreSQL**: FK 제약 생성 시 두 컬럼 타입이 **사실상 동일**해야 한다. `bigint`가
  `integer`를 참조하면 다음 에러로 거부한다.
  > `foreign key constraint cannot be implemented: Key columns are of incompatible types: bigint and integer`

### SnapHaven에서의 상황
PK는 `@PrimaryGeneratedColumn('increment')` → Postgres에서 `SERIAL`(=`int4`).
그런데 FK 컬럼들은 `@Column({ type: 'bigint' })`로 선언돼 있었다
(`media_items.owner_id/album_id`, `albums.owner_id`, `user_collections.user_id`).
→ MySQL에선 통했지만 Postgres FK 생성에서 깨진다.

### 결정: 생성 PK/FK를 `int`로 통일
두 가지 선택지가 있었다.
1. **FK를 `int`로** (채택): PK가 `int4`이므로 FK도 `int4`로 맞춤.
2. PK를 `bigint`로: 더 큰 확장성. 그러나 **node-postgres는 `bigint`를 JS `string`으로
   반환**한다(정밀도 손실 방지). 코드 곳곳의 `item.id === mediaId` 같은 **숫자 비교가
   문자열 vs 숫자로 깨진다.**

→ 목표 시딩 규모(미디어 500만~수천만 행)는 `int4` 한계(약 21억) 내이므로 `int`로 통일했다.
운영 초대규모로 가면 `bigint identity`로 승격 + 문자열 ID 핸들링(transformer)을 도입하는 것이
정석이며, 이는 별도 마이그레이션으로 가능하다.
- 예외: `tags.id`는 애플리케이션이 직접 부여하는 `bigint`이고, 조인 테이블의 `tag_id`가
  자동으로 `bigint`로 생성되어 **자기 일관성**을 가지므로 그대로 두었다.

---

## 2. PostgreSQL ENUM — 컬럼마다 별도 타입이 만들어진다

### 마주친 에러
피드 조회가 500. 로그:
> `operator does not exist: albums_status_enum = media_items_status_enum` (SQLSTATE 42883)

### 원인
TypeORM은 `@Column({ type:'enum' })`마다 **테이블 전용 enum 타입**을 만든다.
`ContentStatus`가 `media_items.status`와 `albums.status` 두 곳에 쓰이는데, 각각
`media_items_status_enum`, `albums_status_enum`이라는 **서로 다른 타입**이 생성됐다.

피드 쿼리는 동일 파라미터 `:status`를 두 컬럼에 재사용한다.
```ts
.where('media.status = :status', { status: ACTIVE })
.orWhere('album.status = :status', { status: ACTIVE }) // 같은 :status 재사용
```
바인딩 파라미터 `$1`은 **첫 사용처(media.status)** 기준으로 `media_items_status_enum`으로
타입 추론된다. 그 다음 `album.status = $1`은 `albums_status_enum = media_items_status_enum`,
즉 **서로 다른 enum 타입 비교**가 되어 연산자가 없다고 거부된다.
- MySQL에선 enum이 내부적으로 문자열이라 이 비교가 그냥 통했다.

### 해결: 하나의 enum 타입을 공유(`enumName`)
```ts
@Column({ type:'enum', enum: ContentStatus, enumName: 'content_status_enum', ... })
```
두 엔티티에서 동일한 `enumName`을 지정 → PG에 `content_status_enum` **단일 타입**만 생성.
이제 두 컬럼이 같은 타입이므로 같은 파라미터로 비교해도 동작한다(**쿼리 수정 불필요**,
모든 교차 참조가 자동 해결).

### 추가 함정: 마이그레이션 생성기의 중복 `CREATE TYPE`
`enumName`을 공유해도 `migration:generate`가 `CREATE TYPE content_status_enum`을 **두 번**
생성한다(컬럼마다 1번). 두 번째에서 "타입이 이미 존재" 에러. → 초기 마이그레이션에서
중복 `CREATE TYPE` 1줄과 down()의 조기 `DROP TYPE` 1줄을 **수동 제거**했다.
(이후 재생성 시엔 타입이 이미 DB에 있어 중복이 안 생긴다 — 일회성 수정.)

---

## 3. 식별자 대소문자 폴딩(case folding) — 따옴표 없으면 소문자

### 개념
- **PostgreSQL**: 따옴표 없는 식별자는 **소문자로 폴딩**된다. `likeCount`(무따옴표) →
  `likecount`. 반면 `"likeCount"`(따옴표)는 대소문자가 보존된다.
- **MySQL**: 식별자가 기본적으로 대소문자를 구분하지 않아 이 문제가 안 보였다.

### 마주친 에러 (POPULAR 정렬)
> `column "likecount" does not exist`

SELECT는 `COUNT(...) AS "likeCount"`(따옴표 보존)인데, TypeORM의 `orderBy('likeCount')`가
`ORDER BY likeCount`(**따옴표 없이**) 생성 → PG가 `likecount`로 찾다가 실패.

### 해결: alias 대신 "집계식 자체"로 정렬
```ts
// before: qb.orderBy('likeCount', 'DESC')
qb.orderBy('COUNT(DISTINCT likes.id)', 'DESC')      // 피드 POPULAR
.orderBy('MAX(uml.created_at)', 'DESC')             // 좋아요 목록(likedAt)
```
집계식으로 정렬하면 alias 따옴표 문제가 사라지고 MySQL/PG 모두에서 동작한다.
(`media.id`, `cmi.created_at` 처럼 `alias.column` 형태는 TypeORM이 자동으로 따옴표를 붙여
주므로 문제없다 — 위험한 건 **계산된 SELECT alias로 정렬**하는 경우뿐이었다.)

### 참고: getRawMany 반환 키는 안전했다
`addSelect(expr, 'likeCount')`의 alias는 TypeORM이 `AS "likeCount"`로 **따옴표**를 붙여
SELECT하므로, `getRawMany()` 결과 키도 `likeCount`로 **대소문자 보존**된다. 그래서
`raw.likeCount`, `raw.totalCount`, `raw.isContentContained` 등의 매핑은 그대로 동작했다.

### 검색: `LIKE` → `ILIKE`
MySQL의 `LIKE`는 기본 콜레이션에서 대소문자를 구분하지 않는다. Postgres의 `LIKE`는
**대소문자를 구분**한다. 제목/설명 검색의 의도(대소문자 무시)를 유지하려고 `ILIKE`로 바꿨다.
검증: `keyword=beach`와 `keyword=BEACH` 모두 동일 결과.

---

## 4. 타입 매핑 세부

| MySQL | PostgreSQL | 비고 |
|---|---|---|
| `tinyint` | `smallint` | PG엔 tinyint 없음. `is_representative`(0/1) 숫자 의미 유지 |
| `bigint`(FK) | `integer` | 1번 항목 참조 |
| `bigint`(카운터) | `bigint` | `download_count`는 FK 아님 → 유지. 단 JS에선 string으로 와서 `parseInt` 처리 |
| `enum` | native `ENUM` 타입 | 2번 항목 참조 |
| `timestamp DEFAULT CURRENT_TIMESTAMP` | `TIMESTAMP DEFAULT now()` | TypeORM이 자동 변환 |

---

## 5. 마이그레이션 정식 도입

기존엔 `synchronize:false`인데 마이그레이션도 없어 스키마가 "수동 관리" 상태였다(재현 불가,
협업/배포 위험). 전환을 계기로 **TypeORM 마이그레이션을 도입**했다.

- `src/data-source.ts`: CLI 전용 DataSource(앱 런타임 설정과 분리). `dotenv`로 `.env.<NODE_ENV>` 로드.
- CLI 스크립트: 경로 별칭(`src/*`, baseUrl 기준)을 런타임에 해석하기 위해
  `ts-node/register` + `tsconfig-paths/register`를 함께 등록.
  ```json
  "typeorm": "cross-env TS_NODE_TRANSPILE_ONLY=true node -r ts-node/register -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d src/data-source.ts"
  ```
- 사용: `npm run typeorm -- migration:generate src/migrations/Init` → `npm run migration:run`.
- 런타임(app.module)은 `migrationsRun:false`. 마이그레이션은 **배포 단계에서 명시 실행**한다.

---

## 6. @ManyToMany 조인 테이블의 "추가 컬럼" 한계

### 마주친 에러 (좋아요 목록 / 컬렉션 / 프로필 500)
> `column uml.created_at does not exist` / `column cmi.created_at does not exist`

### 원인
`@ManyToMany` + `@JoinTable`로 만들어지는 조인 테이블(`user_media_likes`,
`collection_media_items`)은 **연결 키 두 개(media_id, user_id 등)만** 가진다. TypeORM은
조인 테이블의 **추가 컬럼(created_at)을 모델링하지 못한다.** 그러나 애플리케이션은
"좋아요한 순/컬렉션에 담은 순" 정렬을 위해 `created_at`을 사용한다(원본 MySQL 스키마에는
수동으로 존재했던 컬럼). → 마이그레이션 생성 시 누락되어 런타임에 깨졌다.

### 해결(현재) 및 후속(권장)
- **현재**: 별도 마이그레이션 `AddJoinTableTimestamps`로 두 조인 테이블에
  `created_at TIMESTAMP NOT NULL DEFAULT now()` 추가. 관계를 통한 insert 시 default로 채워진다.
- **주의/후속**: 이 컬럼들은 엔티티 모델에 없으므로 향후 `migration:generate`가 이를 **DROP**
  하려 할 수 있다. 정석 해결은 조인 테이블을 **명시적 엔티티**(`UserMediaLike`,
  `CollectionMediaItem`)로 승격하는 것이며, 소셜 기능(Phase 2)에서 좋아요에 타임스탬프/메타가
  필요해질 때 함께 진행하는 것을 권장한다.

---

## 7. 로컬 개발 환경 — 호스트 네이티브 서비스와의 포트 충돌

`docker-compose.local.yml`로 Postgres/Redis를 띄웠는데 두 가지 미묘한 버그를 겪었다.

1. **Postgres**: 앱이 `localhost:5432`로 접속하면 **호스트에 이미 떠 있던 네이티브
   Postgres**(`::1:5432`)로 연결되어 `role "snaphaven" does not exist` 발생(컨테이너가 아닌
   다른 DB였음). → 컨테이너를 **호스트 5433**으로 매핑, `DB_HOST=127.0.0.1`, `DB_PORT=5433`.
2. **Redis**: 마찬가지로 호스트 네이티브 Redis(6379)에 붙어 **스테일 캐시**를 서빙했다(앨범
   대표가 피드에 안 보이는 것처럼 착시). → 컨테이너를 **6380**으로 매핑, `REDIS_PORT=6380`.

교훈: "localhost"는 `::1`/`127.0.0.1`로 해석되며 **호스트 프로세스가 도커 포트 매핑보다
우선**할 수 있다. 로컬 스택은 호스트 서비스와 **포트를 분리**해 자립시키는 것이 안전하다.
(이때 "피드에서 사라진 앨범 대표"는 DB 버그가 아니라 **다른 Redis의 캐시 적중**이었다 —
실제 SQL은 정상. 캐시 계층이 있는 시스템 디버깅의 전형적 함정.)

---

## 8. 검증 방법(이 단계의 "완료" 기준)

- `npm run build` 통과(타입 에러 0)
- `npm test` 통과
- 로컬 Postgres에 마이그레이션 생성·실행 성공(테이블 11 + enum 4)
- 엔드포인트 스모크 전수 통과:
  - 공개: health(DB ping), 피드 LATEST/POPULAR/커서(having)/검색(ILIKE 대소문자), 상세, 앨범 상세
  - 인증(JWT 직접 발급): 프로필, 내 업로드, 좋아요 목록, 컬렉션, 컬렉션 콘텐츠
- Redis 캐시 Hit/Miss 동작 확인

---

## 부록: 다른 RDBMS로 옮길 때 재확인 체크리스트
1. FK/PK 타입 정합성(특히 int vs bigint)
2. enum 처리 방식(네이티브 타입 vs 문자열/체크제약)
3. 식별자 대소문자 정책(특히 alias 정렬/참조)
4. 대소문자 무시 검색(`ILIKE`/`citext`/콜레이션)
5. 조인 테이블 추가 컬럼 존재 여부
6. 함수 차이(`NOW()`, 문자열/날짜 함수 등 — 이번엔 MySQL 전용 함수 사용 없음)
