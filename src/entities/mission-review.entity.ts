import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Meeting } from './meeting.entity';

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('mission_reviews')
@Unique(['meetingId', 'userId']) // 복합 unique key로 중복 리뷰 방지
export class MissionReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 26 })
  meetingId: string;

  @Column({ type: 'varchar', length: 26 })
  userId: string;

  @Column({ type: 'text' })
  reviewText: string;

  @Column({ type: 'integer' })
  rating: number; // 1-5점

  @Column({ type: 'varchar', length: 512, array: true })
  photoUrls: string[];

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  aiVerificationStatus: VerificationStatus;

  @Column({ type: 'integer', default: 0 })
  earnedPoints: number;

  @Column({ type: 'jsonb', nullable: true })
  pointCalculationDetails: {
    basePoints: number;
    finalPoints: number;
    calculations: Array<{
      type:
        | 'base'
        | 'host_bonus'
        | 'duplicate_penalty'
        | 'duration_bonus'
        | 'quality_bonus';
      amount: number;
      description: string;
      details?: any;
    }>;
    metadata: {
      calculatedAt: string;
      isHost: boolean;
      meetingDuration: number;
      minimumDuration: number;
    };
  } | null;

  @CreateDateColumn({ type: 'timestamptz' })
  submittedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => Meeting)
  @JoinColumn({ name: 'meetingId' })
  meeting?: Meeting;
}
