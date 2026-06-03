import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1780447625805 implements MigrationInterface {
    name = 'Init1780447625805'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tags" ("id" bigint NOT NULL, "name" character varying(20) NOT NULL, CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."content_status_enum" AS ENUM('PENDING', 'PROCESSING', 'ACTIVE', 'FAILED', 'DELETED')`);
        await queryRunner.query(`CREATE TABLE "albums" ("id" SERIAL NOT NULL, "owner_id" integer NOT NULL, "title" character varying(30), "description" text, "status" "public"."content_status_enum" NOT NULL DEFAULT 'ACTIVE', "key_thumbnail" character varying(2048), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_838ebae24d2e12082670ffc95d7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_collections" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "name" character varying(30) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0f50c79662214ef4d0f14956980" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."media_items_type_enum" AS ENUM('IMAGE', 'VIDEO')`);
        // content_status_enum 은 albums 생성 시 이미 만들어졌으므로 중복 생성 제거(TypeORM generate quirk).
        await queryRunner.query(`CREATE TABLE "media_items" ("id" SERIAL NOT NULL, "owner_id" integer NOT NULL, "album_id" integer, "type" "public"."media_items_type_enum" NOT NULL DEFAULT 'IMAGE', "width" integer NOT NULL, "height" integer NOT NULL, "title" character varying(30) NOT NULL, "description" text, "is_representative" smallint DEFAULT '0', "status" "public"."content_status_enum" NOT NULL DEFAULT 'PENDING', "deleted_at" TIMESTAMP, "s3_key_original" character varying(2048) NOT NULL, "key_image_large" character varying(2048), "key_image_medium" character varying(2048), "key_image_small" character varying(2048), "key_video_playback" character varying(2048), "key_video_preview" character varying(2048), "download_count" bigint NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c23c721eba990b8d9c28c48592c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_auth_provider_enum" AS ENUM('EMAIL', 'GOOGLE', 'APPLE')`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying(40) NOT NULL, "password_hash" character varying(255), "nickname" character varying(20) NOT NULL, "profile_image_key" character varying(255), "auth_provider" "public"."users_auth_provider_enum" NOT NULL DEFAULT 'EMAIL', "sns_id" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "token_version" integer NOT NULL DEFAULT '0', "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_ad02a1be8707004cb805a4b5023" UNIQUE ("nickname"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "album_tags" ("album_id" integer NOT NULL, "tag_id" bigint NOT NULL, CONSTRAINT "PK_9eeedfef93e04402bb77fa254e8" PRIMARY KEY ("album_id", "tag_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4682847b50af09bd898c5ab3fd" ON "album_tags" ("album_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_23604287e3987eea347fac1e81" ON "album_tags" ("tag_id") `);
        await queryRunner.query(`CREATE TABLE "user_album_likes" ("album_id" integer NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_e1fa42725f867297b7dba781b71" PRIMARY KEY ("album_id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_abaa9347ce7109382c8327a5b9" ON "user_album_likes" ("album_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c2c9130e9f98616a7fe209cf01" ON "user_album_likes" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "collection_media_items" ("collection_id" integer NOT NULL, "media_id" integer NOT NULL, CONSTRAINT "PK_960d2ae28a970de2b8c8b78acbf" PRIMARY KEY ("collection_id", "media_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8b7ec5d4fc3243db834291383d" ON "collection_media_items" ("collection_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_288beee444871f489d35d1842b" ON "collection_media_items" ("media_id") `);
        await queryRunner.query(`CREATE TABLE "media_tags" ("media_id" integer NOT NULL, "tag_id" bigint NOT NULL, CONSTRAINT "PK_94399b78446fdb1ba265b6cfa69" PRIMARY KEY ("media_id", "tag_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97c2aa8b3e35568336b5becd91" ON "media_tags" ("media_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_438b67ec9b74348a1ae2011422" ON "media_tags" ("tag_id") `);
        await queryRunner.query(`CREATE TABLE "user_media_likes" ("media_id" integer NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_835839937a8789ed3026a0b5790" PRIMARY KEY ("media_id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b5341049f7b6a74ba1cec32b2e" ON "user_media_likes" ("media_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_754e41483a0fb2f66b764bbfd9" ON "user_media_likes" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "albums" ADD CONSTRAINT "FK_14dfb720709372ede2fc2e15859" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_collections" ADD CONSTRAINT "FK_64c12326d36a9ead157b3757d43" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "media_items" ADD CONSTRAINT "FK_2dae0128e1e96bce5000f53f54e" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "media_items" ADD CONSTRAINT "FK_21828f9189c9ac40cd66be74df1" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "album_tags" ADD CONSTRAINT "FK_4682847b50af09bd898c5ab3fda" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "album_tags" ADD CONSTRAINT "FK_23604287e3987eea347fac1e810" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_album_likes" ADD CONSTRAINT "FK_abaa9347ce7109382c8327a5b92" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_album_likes" ADD CONSTRAINT "FK_c2c9130e9f98616a7fe209cf019" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "collection_media_items" ADD CONSTRAINT "FK_8b7ec5d4fc3243db834291383d1" FOREIGN KEY ("collection_id") REFERENCES "user_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "collection_media_items" ADD CONSTRAINT "FK_288beee444871f489d35d1842b0" FOREIGN KEY ("media_id") REFERENCES "media_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "media_tags" ADD CONSTRAINT "FK_97c2aa8b3e35568336b5becd912" FOREIGN KEY ("media_id") REFERENCES "media_items"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "media_tags" ADD CONSTRAINT "FK_438b67ec9b74348a1ae20114226" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_media_likes" ADD CONSTRAINT "FK_b5341049f7b6a74ba1cec32b2ec" FOREIGN KEY ("media_id") REFERENCES "media_items"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_media_likes" ADD CONSTRAINT "FK_754e41483a0fb2f66b764bbfd9f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_media_likes" DROP CONSTRAINT "FK_754e41483a0fb2f66b764bbfd9f"`);
        await queryRunner.query(`ALTER TABLE "user_media_likes" DROP CONSTRAINT "FK_b5341049f7b6a74ba1cec32b2ec"`);
        await queryRunner.query(`ALTER TABLE "media_tags" DROP CONSTRAINT "FK_438b67ec9b74348a1ae20114226"`);
        await queryRunner.query(`ALTER TABLE "media_tags" DROP CONSTRAINT "FK_97c2aa8b3e35568336b5becd912"`);
        await queryRunner.query(`ALTER TABLE "collection_media_items" DROP CONSTRAINT "FK_288beee444871f489d35d1842b0"`);
        await queryRunner.query(`ALTER TABLE "collection_media_items" DROP CONSTRAINT "FK_8b7ec5d4fc3243db834291383d1"`);
        await queryRunner.query(`ALTER TABLE "user_album_likes" DROP CONSTRAINT "FK_c2c9130e9f98616a7fe209cf019"`);
        await queryRunner.query(`ALTER TABLE "user_album_likes" DROP CONSTRAINT "FK_abaa9347ce7109382c8327a5b92"`);
        await queryRunner.query(`ALTER TABLE "album_tags" DROP CONSTRAINT "FK_23604287e3987eea347fac1e810"`);
        await queryRunner.query(`ALTER TABLE "album_tags" DROP CONSTRAINT "FK_4682847b50af09bd898c5ab3fda"`);
        await queryRunner.query(`ALTER TABLE "media_items" DROP CONSTRAINT "FK_21828f9189c9ac40cd66be74df1"`);
        await queryRunner.query(`ALTER TABLE "media_items" DROP CONSTRAINT "FK_2dae0128e1e96bce5000f53f54e"`);
        await queryRunner.query(`ALTER TABLE "user_collections" DROP CONSTRAINT "FK_64c12326d36a9ead157b3757d43"`);
        await queryRunner.query(`ALTER TABLE "albums" DROP CONSTRAINT "FK_14dfb720709372ede2fc2e15859"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_754e41483a0fb2f66b764bbfd9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b5341049f7b6a74ba1cec32b2e"`);
        await queryRunner.query(`DROP TABLE "user_media_likes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_438b67ec9b74348a1ae2011422"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97c2aa8b3e35568336b5becd91"`);
        await queryRunner.query(`DROP TABLE "media_tags"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_288beee444871f489d35d1842b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8b7ec5d4fc3243db834291383d"`);
        await queryRunner.query(`DROP TABLE "collection_media_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c2c9130e9f98616a7fe209cf01"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_abaa9347ce7109382c8327a5b9"`);
        await queryRunner.query(`DROP TABLE "user_album_likes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_23604287e3987eea347fac1e81"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4682847b50af09bd898c5ab3fd"`);
        await queryRunner.query(`DROP TABLE "album_tags"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_auth_provider_enum"`);
        await queryRunner.query(`DROP TABLE "media_items"`);
        await queryRunner.query(`DROP TYPE "public"."media_items_type_enum"`);
        await queryRunner.query(`DROP TABLE "user_collections"`);
        await queryRunner.query(`DROP TABLE "albums"`);
        await queryRunner.query(`DROP TYPE "public"."content_status_enum"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }

}
