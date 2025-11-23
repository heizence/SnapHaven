import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Album } from 'src/albums/entities/album.entity';
import { Tag } from 'src/tags/entities/tag.entity';
//import { Collection } from 'src/collections/entities/collection.entity'; // 컬렉션 N:M 관계 [cite: 632]
import { ContentType, ContentStatus } from 'src/common/enums'; // ENUMs

@Entity('media_items')
export class MediaItem {
  @PrimaryGeneratedColumn('increment') // BIGINT PK [cite: 609]
  id: number;

  // owner_id (FK to users.id) [cite: 609]
  @Column({ name: 'owner_id', type: 'bigint' })
  ownerId: number;

  // album_id (FK to albums.id), Nullable [cite: 609]
  @Column({ name: 'album_id', type: 'bigint', nullable: true })
  albumId: number | null;

  @Column({ type: 'enum', enum: ContentType, default: ContentType.IMAGE })
  type: ContentType; // IMAGE or VIDEO [cite: 609]

  @Column({ type: 'varchar', length: 30 })
  title: string; // [cite: 609]

  // Pipeline Status & Soft Delete [cite: 610, 645]
  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.PENDING })
  status: ContentStatus;

  // S3 URL & Key Storage (VARCHAR 2048)
  // [cite: 610, 636]
  @Column({ name: 's3_key_original', type: 'varchar', length: 2048 })
  s3KeyOriginal: string; // Private S3 Key

  @Column({ name: 'url_large', type: 'varchar', length: 2048, nullable: true })
  urlLarge: string | null;

  @Column({ name: 'url_medium', type: 'varchar', length: 2048, nullable: true })
  urlMedium: string | null;

  @Column({ name: 'url_small', type: 'varchar', length: 2048, nullable: true })
  urlSmall: string | null; // Thumbnail URL

  @Column({
    name: 'url_video_playback',
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  urlVideoPlayback: string | null; // Video playback URL

  @Column({
    name: 'url_video_preview',
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  urlVideoPreview: string | null; // Video hover preview clip URL

  @Column({ name: 'download_count', type: 'bigint', default: 0 })
  downloadCount: number; // [cite: 610]

  // ---------------- Relationships ----------------

  // TODO : 추후 수정
  // 1. User (Owner)와의 Many-to-One 관계
  // @ManyToOne(() => User, (user) => user.mediaItems)
  // @JoinColumn({ name: 'owner_id' })
  // owner: User;

  // 2. Album과의 Many-to-One 관계
  @ManyToOne(() => Album, (album) => album.mediaItems)
  @JoinColumn({ name: 'album_id' })
  album: Album; // [cite: 590]

  // 3. Tag와의 Many-to-Many 관계 (media_tags 테이블 사용) [cite: 591, 617]
  @ManyToMany(() => Tag, (tag) => tag.mediaItems, {
    cascade: true,
    eager: true,
  })
  @JoinTable({ name: 'media_tags' })
  tags: Tag[];

  // TODO : 추후 수정
  // 4. UserLikes와의 Many-to-Many 관계 (user_media_likes 테이블 사용) [cite: 593, 622]
  // @ManyToMany(() => User, (user) => user.likedMediaItems)
  // @JoinTable({ name: 'user_media_likes' })
  // likedByUsers: User[];

  // TODO : 추후 수정
  // 5. Collection과의 Many-to-Many 관계 (collection_media_items 테이블 사용) [cite: 596, 632]
  // @ManyToMany(() => Collection, (collection) => collection.mediaItems)
  // @JoinTable({ name: 'collection_media_items' })
  // collections: Collection[];

  // ---------------- Timestamps ----------------
  @CreateDateColumn()
  created_at: Date;

  @CreateDateColumn()
  updated_at: Date;
}
