import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ulid } from 'ulid';
import { User } from './user.entity';
import { Meeting } from './meeting.entity';

export enum ActivityType {
  MEETING_JOINED = 'meeting_joined', // 모임에 참여함
  MEETING_CREATED = 'meeting_created', // 모임을 생성함 (호스트)
  MEETING_STARTED = 'meeting_started', // 모임이 시작됨
  MEETING_LIKED = 'meeting_liked', // 내 모임에 좋아요를 받음
  PHOTO_VERIFICATION_SUBMITTED = 'photo_verification_submitted', // 사진 인증 신청 (추후 구현)
  PHOTO_VERIFICATION_APPROVED = 'photo_verification_approved', // 사진 인증 승인 (추후 구현)
  PHOTO_VERIFICATION_REJECTED = 'photo_verification_rejected', // 사진 인증 반려 (추후 구현)
}

@Entity('activity_logs')
@Index(['userId', 'createdAt'])
@Index(['activityType', 'createdAt'])
export class ActivityLog {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar', length: 26 })
  userId: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  activityType: ActivityType;

  @Column({ type: 'varchar', length: 26, nullable: true })
  meetingId?: string;

  @Column({ type: 'varchar', length: 26, nullable: true })
  relatedUserId?: string; // 좋아요를 누른 사용자 등

  @Column({ type: 'text', nullable: true })
  metadata?: string; // JSON 형태로 추가 정보 저장

  @Column({ type: 'boolean', default: false })
  isRead: boolean; // 사용자가 확인했는지 여부

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Meeting, (meeting) => meeting.id, { nullable: true })
  @JoinColumn({ name: 'meetingId' })
  meeting?: Meeting;

  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  @JoinColumn({ name: 'relatedUserId' })
  relatedUser?: User;

  constructor() {
    if (!this.id) {
      this.id = ulid();
    }
  }
}
