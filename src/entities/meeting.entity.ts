import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { Mission } from './mission.entity';
import { User } from './user.entity';
import { MeetingParticipant } from './meeting-participant.entity';
import { MeetingProfile } from './meeting-profile.entity';
import { MeetingLike } from './meeting-like.entity';

export enum MeetingStatus {
  RECRUITING = 'recruiting',
  READY = 'ready',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
}

@Entity('meetings')
export class Meeting {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar' })
  missionId: string;

  @Column({ type: 'varchar' })
  hostUserId: string;

  @Column({ type: 'timestamptz' })
  recruitUntil: Date;

  @Column({ type: 'timestamptz' })
  scheduledAt: Date;

  @Column({
    type: 'enum',
    enum: MeetingStatus,
    default: MeetingStatus.RECRUITING,
  })
  status: MeetingStatus;

  @Column({ type: 'integer', default: 4 })
  maxParticipants: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  qrCodeToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  qrGeneratedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  introduction: string | null;

  @Column({ type: 'integer', default: 50 })
  focusScore: number;

  @Column({ type: 'integer', default: 0 })
  likesCount: number;

  // Point-related fields
  @Column({ type: 'integer', nullable: true })
  requiredPoints: number; // 참여에 필요한 포인트 (mission basePoints * 1배)

  @Column({ type: 'integer', nullable: true })
  rewardPoints: number; // 완료 시 받을 포인트 (mission basePoints)

  @Column({ type: 'boolean', default: false })
  isPointsCollected: boolean; // 포인트 수집 완료 여부

  @Column({ type: 'boolean', default: false })
  isRewardsDistributed: boolean; // 보상 지급 완료 여부

  // Cancellation policy fields
  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'varchar', length: 26, nullable: true })
  cancelledBy: string; // 취소한 사용자 ID

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ type: 'integer', default: 2 })
  minimumParticipants: number; // 최소 참여 인원 (호스트 포함)

  // 알림 관련 필드들
  @Column({ type: 'timestamptz', nullable: true })
  lastWarningAt: Date | null; // 마지막 모집 마감 경고 시간

  @Column({ type: 'timestamptz', nullable: true })
  lastReminderAt: Date | null; // 마지막 활동 시작 리마인더 시간

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Mission)
  @JoinColumn({ name: 'missionId' })
  mission?: Mission;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'hostUserId' })
  host?: User;

  @OneToMany(() => MeetingParticipant, (participant) => participant.meeting)
  participantList?: MeetingParticipant[];

  @OneToOne(() => MeetingProfile, (profile) => profile.meeting)
  profile?: MeetingProfile;

  @OneToMany(() => MeetingLike, (like) => like.meeting)
  likes?: MeetingLike[];

  constructor() {
    if (!this.id) {
      this.id = ulid();
    }
  }
}
