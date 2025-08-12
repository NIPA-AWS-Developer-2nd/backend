import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Mission } from './mission.entity';
import { Meeting } from './meeting.entity';
import { MissionReview } from './mission-review.entity';

@Entity('user_missions')
export class UserMission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 26 })
  userId: string;

  @Column({ type: 'varchar', length: 26 })
  missionId: string;

  @Column({ type: 'integer', nullable: true })
  reviewId: number | null;

  @Column({ type: 'varchar', length: 26 })
  lastMeetingId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => Mission)
  @JoinColumn({ name: 'missionId' })
  mission?: Mission;

  @ManyToOne(() => Meeting)
  @JoinColumn({ name: 'lastMeetingId' })
  lastMeeting?: Meeting;

  @ManyToOne(() => MissionReview, { nullable: true })
  @JoinColumn({ name: 'reviewId' })
  review?: MissionReview | null;
}
