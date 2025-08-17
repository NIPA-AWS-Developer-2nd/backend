import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Meeting } from './meeting.entity';
import { MeetingProfileTrait } from './meeting-profile-trait.entity';

@Entity('meeting_profiles')
export class MeetingProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  meetingId: string;

  @Column({ type: 'varchar', length: 100, default: '' })
  introduction: string;

  @Column({ type: 'smallint', default: 50 })
  focusScore: number;

  @Column({ type: 'integer', default: 0 })
  hostStake: number;

  @Column({ type: 'integer', default: 0 })
  participantStake: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => Meeting, (meeting) => meeting.profile)
  @JoinColumn({ name: 'meetingId' })
  meeting?: Meeting;
}
