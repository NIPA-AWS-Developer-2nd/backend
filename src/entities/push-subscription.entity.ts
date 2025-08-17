import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ulid } from 'ulid';

@Entity('push_subscriptions')
export class PushSubscription {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string = ulid();

  @Column({ type: 'varchar', length: 26, name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  endpoint: string;

  @Column({ type: 'text', name: 'p256dh_key' })
  p256dhKey: string;

  @Column({ type: 'text', name: 'auth_key' })
  authKey: string;

  @Column({ type: 'varchar', length: 100, default: 'chrome' })
  browser: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}