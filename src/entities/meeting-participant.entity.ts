import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Meeting } from './meeting.entity';
import { User } from './user.entity';

export enum ParticipantStatus {
  JOINED = 'joined',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
}

@Entity('meeting_participants')
export class MeetingParticipant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  meetingId: string;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'boolean', default: false })
  isHost: boolean;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.JOINED,
  })
  status: ParticipantStatus;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  // Point payment tracking
  @Column({ type: 'boolean', default: false })
  pointsPaid: boolean; // 참여비 지불 완료 여부

  @Column({ type: 'integer', nullable: true })
  paidAmount: number; // 지불한 포인트 양

  @Column({ type: 'varchar', length: 26, nullable: true })
  paymentTransactionId: string; // 결제 트랜잭션 ID

  @Column({ type: 'boolean', default: false })
  rewardReceived: boolean; // 보상 수령 완료 여부

  @Column({ type: 'varchar', length: 26, nullable: true })
  rewardTransactionId: string; // 보상 트랜잭션 ID

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Meeting, (meeting) => meeting.participantList)
  @JoinColumn({ name: 'meetingId' })
  meeting?: Meeting;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;
}
