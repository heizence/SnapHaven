import { Entity, Column, ManyToMany, PrimaryColumn } from 'typeorm';
import { MediaItem } from 'src/media-items/entities/media-item.entity';
import { Album } from 'src/albums/entities/album.entity';

@Entity('tags')
export class Tag {
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  name: string;

  // MediaItem 과의 다대다 관계 (media_tags 테이블의 역방향)
  // @JoinTable 데코레이터는 MediaItem 엔티티에 위치한다.
  @ManyToMany(() => MediaItem, (mediaItem) => mediaItem.tags)
  mediaItems: MediaItem[];

  // Album 과의 다대다 관계 (album_tags 테이블의 역방향)
  // @JoinTable 데코레이터는 Album 엔티티에 위치한다.
  @ManyToMany(() => Album, (album) => album.tags)
  albums: Album[];
}
