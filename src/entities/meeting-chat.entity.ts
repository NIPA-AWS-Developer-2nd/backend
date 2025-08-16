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

@Entity('meeting_chats')
export class MeetingChat {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string = ulid();

  @Column({ type: 'varchar', length: 26, name: 'meeting_id' })
  meetingId: string;

  @Column({ type: 'varchar', length: 26, name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 20, default: 'text' })
  messageType: 'text' | 'image' | 'system';

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Meeting, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}