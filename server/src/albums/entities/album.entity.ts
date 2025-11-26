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

  // Soft Delete
  @Column({ type: 'enum', enum: ContentStatus, default: ContentStatus.ACTIVE })
  status: ContentStatus;

  // ---------------- Relationships ----------------

  // TODO : 추후 수정
  // 1. User (Owner)와의 Many-to-One 관계
  // @ManyToOne(() => User, (user) => user.albums)
  // @JoinColumn({ name: 'owner_id' })
  // owner: User; // [cite: 589]

  // 2. MediaItem과의 One-to-Many 관계
  @OneToMany(() => MediaItem, (media) => media.album)
  mediaItems: MediaItem[]; // [cite: 590]

  // 3. Tag와의 Many-to-Many 관계 (album_tags 테이블 생성) [cite: 619, 621]
  @ManyToMany(() => Tag, (tag) => tag.albums, { cascade: true })
  @JoinTable({
    name: 'album_tags',
    joinColumn: {
      name: 'album_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'tag_id',
      referencedColumnName: 'id',
    },
  })
  tags: Tag[];

  // TODO : 추후 수정
  // 4. UserLikes (앨범 좋아요)와의 Many-to-Many 관계 (user_album_likes 테이블 생성) [cite: 625, 627]
  // @ManyToMany(() => User, (user) => user.likedAlbums)
  // @JoinTable({ name: 'user_album_likes' })
  // likedByUsers: User[];

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
