import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * @ManyToMany @JoinTable 은 조인 테이블의 '추가 컬럼'을 모델링하지 못한다.
 * 그러나 애플리케이션은 좋아요/컬렉션 담은 '시각' 기준 정렬을 위해
 *  - user_media_likes.created_at  (MAX(uml.created_at) 로 '좋아요한 순' 정렬)
 *  - collection_media_items.created_at  ('컬렉션에 담은 순' 정렬/썸네일)
 * 컬럼을 사용한다(원본 MySQL 스키마에도 존재했음).
 *
 * 주의: 이 컬럼들은 엔티티 모델에 없으므로 향후 `migration:generate` 가
 * 이를 DROP 하려고 시도할 수 있다. 후속 단계에서 조인 테이블을 명시적
 * 엔티티(UserMediaLike / CollectionMediaItem)로 승격하는 것을 권장.
 */
export class AddJoinTableTimestamps1780447700000 implements MigrationInterface {
  name = 'AddJoinTableTimestamps1780447700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_media_likes" ADD COLUMN "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_media_items" ADD COLUMN "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collection_media_items" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_media_likes" DROP COLUMN "created_at"`,
    );
  }
}
