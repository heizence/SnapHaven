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
import { MediaItem } from 'src/media-items/entities/media-item.entity';

@Entity('user_collections')
export class Collection {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // user_id (FK to users.id)
  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ type: 'varchar', length: 30, nullable: false })
  name: string;

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
  @ManyToOne(() => User, (user) => user.collections)
  @JoinColumn({ name: 'user_id' })
  owner: User;

  // MediaItem과의 Many-to-Many 관계
  @ManyToMany(() => MediaItem, (mediaItem) => mediaItem.collections, {
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'collection_media_items',
    joinColumn: {
      // Collection의 PK를 연결 테이블에 'collection_id'로 저장하도록 명시
      name: 'collection_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      // MediaItem의 PK를 연결 테이블에 'media_id'로 저장하도록 명시
      name: 'media_id',
      referencedColumnName: 'id',
    },
  })
  mediaItems: MediaItem[];
}
