import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Album } from 'src/albums/entities/album.entity';
import { Tag } from 'src/tags/entities/tag.entity';
import { Collection } from 'src/collections/entities/collection.entity';
import { ContentType, ContentStatus } from 'src/common/enums';

@Entity('media_items')
export class MediaItem {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'owner_id', type: 'bigint' })
  ownerId: number;

  @Column({ name: 'album_id', type: 'bigint', nullable: true })
  albumId: number | null;

  @Column({ type: 'enum', enum: ContentType, default: ContentType.IMAGE })
  type: ContentType;

  @Column({ type: 'int', nullable: false })
  width: number | null;

  @Column({ type: 'int', nullable: false })
  height: number | null;

  @Column({ type: 'varchar', length: 30 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.PENDING })
  status: ContentStatus;

  @Column({ name: 's3_key_original', type: 'varchar', length: 2048 })
  s3KeyOriginal: string; // Private S3 Key

  @Column({
    name: 'key_image_large',
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  keyImageLarge: string | null;

  @Column({
    name: 'key_image_medium',
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  keyImageMedium: string | null;

  @Column({
    name: 'key_image_small',
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  keyImageSmall: string | null; // 비디오의 경우 Thumbnail 이미지

  @Column({
    name: 'key_video_playback',
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  keyVideoPlayback: string | null;

  @Column({
    name: 'key_video_preview',
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  keyVideoPreview: string | null;

  @Column({ name: 'download_count', type: 'bigint', default: 0 })
  downloadCount: number;

  @Column({
    type: 'timestamp',
    name: 'created_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // User 와의 Many-to-One 관계
  @ManyToOne(() => User, (user) => user.mediaItems)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  // Album 과의 Many-to-One 관계
  @ManyToOne(() => Album, (album) => album.mediaItems)
  @JoinColumn({ name: 'album_id' })
  album: Album;

  // Tag 와의 Many-to-Many 관계
  @ManyToMany(() => Tag, (tag) => tag.mediaItems, {
    cascade: true,
    eager: true,
  })
  @JoinTable({
    name: 'media_tags', // 연결 테이블 이름
    joinColumn: {
      name: 'media_id', // [!code focus] // 💡 이 테이블(media_items)의 PK를 연결 테이블에 'media_id'로 저장
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'tag_id', // [!code focus] // 💡 연결 테이블에 태그의 PK를 'tag_id'로 저장
      referencedColumnName: 'id',
    },
  })
  tags: Tag[];

  // UserLikes 와의 Many-to-Many 관계
  @ManyToMany(() => User, (user) => user.likedMediaItems)
  @JoinTable({
    name: 'user_media_likes',
    joinColumn: {
      name: 'media_id', // 이 엔티티(MediaItem)의 PK를 'media_id'로 저장
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id', // 연결된 엔티티(User)의 PK를 'user_id'로 저장 (DB 표준)
      referencedColumnName: 'id',
    },
  })
  likedByUsers: User[];

  // Collection 과의 Many-to-Many 관계
  @ManyToMany(() => Collection, (collection) => collection.mediaItems)
  @JoinTable({ name: 'collection_media_items' })
  collections: Collection[];
}
