import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('auth_tokens')
@Index('IDX_auth_tokens_user_id_active', ['userId'], {
  where: 'is_revoked = false',
})
export class AuthToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 26 })
  userId: string;

  @Column({ type: 'varchar', length: 500, unique: true })
  @Index()
  accessToken: string;

  @Column({ type: 'varchar', length: 500 })
  refreshToken: string;

  @Column({ type: 'timestamptz' })
  accessExpiresAt: Date;

  @Column({ type: 'timestamptz' })
  refreshExpiresAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceInfo: string;

  @Column({ type: 'boolean', default: false, name: 'is_revoked' })
  isRevoked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
