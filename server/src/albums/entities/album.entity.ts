import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { Tag } from 'src/tags/entities/tag.entity';
import { ContentStatus } from 'src/common/enums';
import { Collection } from 'src/collections/entities/collection.entity';

@Entity('albums')
export class Album {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // owner_id (FK to users.id)
  @Column({ name: 'owner_id', type: 'bigint' })
  ownerId: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.ACTIVE })
  status: ContentStatus;

  // ---------------- Relationships ----------------
  // User (Owner)와의 Many-to-One 관계
  @ManyToOne(() => User, (user) => user.albums)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  // MediaItem과의 One-to-Many 관계
  @OneToMany(() => MediaItem, (media) => media.album)
  mediaItems: MediaItem[];

  // Tag와의 Many-to-Many 관계 (album_tags 테이블 생성)
  @ManyToMany(() => Tag, (tag) => tag.albums, { cascade: true })
  @JoinTable({
    name: 'album_tags',
    joinColumn: { name: 'album_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];

  // UserLikes (앨범 좋아요)와의 Many-to-Many 관계 (user_album_likes 테이블 생성)
  @ManyToMany(() => User, (user) => user.likedAlbums)
  @JoinTable({
    name: 'user_album_likes', // 연결 테이블 이름 명시
    joinColumn: {
      name: 'album_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  likedByUsers: User[];

  @Column({
    name: 'key_thumbnail',
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  keyThumbnail: string | null;

  // Collection 과의 Many-to-Many 관계
  @ManyToMany(() => Collection, (collection) => collection.albums)
  collections: Collection[];

  // ---------------- Timestamps ----------------
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
}
