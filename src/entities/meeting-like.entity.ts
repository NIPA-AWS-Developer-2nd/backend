import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ulid } from 'ulid';
import { Meeting } from './meeting.entity';
import { User } from './user.entity';

@Entity('meeting_likes')
@Index(['meetingId', 'userId'], { unique: true }) // 중복 방지를 위한 복합 인덱스
export class MeetingLike {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar', length: 26 })
  meetingId: string;

  @Column({ type: 'varchar', length: 26 })
  userId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Meeting, (meeting) => meeting.likes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meetingId' })
  meeting: Meeting;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  constructor() {
    if (!this.id) {
      this.id = ulid();
    }
  }
}