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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Meeting, (meeting) => meeting.participants)
  @JoinColumn({ name: 'meetingId' })
  meeting?: Meeting;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;
}
