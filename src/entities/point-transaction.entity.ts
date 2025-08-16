import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { User } from './user.entity';
import { Meeting } from './meeting.entity';

export enum PointTransactionType {
  MEETING_PAYMENT = 'meeting_payment',
  MEETING_REWARD = 'meeting_reward',
  MEETING_REFUND = 'meeting_refund',
  NO_SHOW_PENALTY = 'no_show_penalty',
  CANCELLATION_PENALTY = 'cancellation_penalty',
  HOST_EARLY_CANCEL_PENALTY = 'host_early_cancel_penalty',
  SYSTEM_ADJUSTMENT = 'system_adjustment',
}

export enum PointTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('point_transactions')
export class PointTransaction {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string = ulid();

  @Column({ type: 'varchar', length: 26 })
  userId: string;

  @Column({ type: 'varchar', length: 26, nullable: true })
  meetingId: string;

  @Column({
    type: 'enum',
    enum: PointTransactionType,
  })
  type: PointTransactionType;

  @Column({
    type: 'enum',
    enum: PointTransactionStatus,
    default: PointTransactionStatus.PENDING,
  })
  status: PointTransactionStatus;

  @Column({ type: 'integer' })
  amount: number; // 양수: 적립, 음수: 차감

  @Column({ type: 'integer' })
  balanceBefore: number; // 거래 전 잔액

  @Column({ type: 'integer' })
  balanceAfter: number; // 거래 후 잔액

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // 추가 정보 (예: 취소 시간, 참석률 등)

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Meeting, { nullable: true })
  @JoinColumn({ name: 'meetingId' })
  meeting: Meeting;
}