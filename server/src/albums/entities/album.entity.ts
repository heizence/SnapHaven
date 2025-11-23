import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { Tag } from 'src/tags/entities/tag.entity';
import { ContentStatus } from 'src/common/enums';

@Entity('albums')
export class Album {
  @PrimaryGeneratedColumn('increment') // BIGINT PK [cite: 605]
  id: number;

  // owner_id (FK to users.id)
  @Column({ name: 'owner_id', type: 'bigint' }) // [cite: 605]
  ownerId: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  title: string | null; // [cite: 605]

  @Column({ type: 'text', nullable: true })
  description: string | null; // [cite: 605]

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
  @JoinTable({ name: 'album_tags' })
  tags: Tag[];

  // TODO : 추후 수정
  // 4. UserLikes (앨범 좋아요)와의 Many-to-Many 관계 (user_album_likes 테이블 생성) [cite: 625, 627]
  // @ManyToMany(() => User, (user) => user.likedAlbums)
  // @JoinTable({ name: 'user_album_likes' })
  // likedByUsers: User[];

  // ---------------- Timestamps ----------------
  @CreateDateColumn()
  created_at: Date;

  @CreateDateColumn()
  updated_at: Date;
}
