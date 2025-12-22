import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuthProvider } from '../../common/enums';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { Collection } from 'src/collections/entities/collection.entity';
import { Album } from 'src/albums/entities/album.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 40, unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_hash: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  nickname: string;

  @Column({
    type: 'varchar',
    name: 'profile_image_key',
    length: 255,
    nullable: true,
  })
  profileImageKey: string | null;

  @Column({
    type: 'enum',
    name: 'auth_provider',
    enum: AuthProvider,
    default: AuthProvider.EMAIL,
    nullable: false,
  })
  authProvider: AuthProvider;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sns_id: string;

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

  @DeleteDateColumn({
    type: 'timestamp',
    name: 'deleted_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  deletedAt: Date;

  @Column({ type: 'int', default: 0 })
  token_version: number;

  // ---------------- Relationships ----------------

  // MediaItem (업로드한 콘텐츠)과의 One-to-Many 관계 (역방향)
  // MediaItem 엔티티의 owner 속성과 연결된다
  @OneToMany(() => MediaItem, (mediaItem) => mediaItem.owner)
  mediaItems: MediaItem[];

  // 소유한 앨범과의 One-to-Many 관계 추가 (역방향)
  @OneToMany(() => Album, (album) => album.owner)
  albums: Album[];

  // 사용자가 좋아요 표시한 미디어 콘텐츠들
  @ManyToMany(() => MediaItem, (mediaItem) => mediaItem.likedByUsers)
  likedMediaItems: MediaItem[];

  // 사용자가 좋아요 표시한 앨범과의 Many-to-Many 관계 추가 (역방향)
  @ManyToMany(() => Album, (album) => album.likedByUsers)
  likedAlbums: Album[];

  // Collection 과의 One-to-Many 관계 (역방향)
  @OneToMany(() => Collection, (collection) => collection.owner, {
    onDelete: 'CASCADE',
  })
  collections: Collection[];
}
