import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuthProvider } from '../../common/enums';

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
    name: 'profile_image_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  profileImageUrl: string | null;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.EMAIL,
    nullable: false,
  })
  auth_provider: AuthProvider;

  @CreateDateColumn()
  created_at: Date;

  @CreateDateColumn()
  updated_at: Date;

  @Column({ type: 'int', default: 0 })
  token_version: number;
}
