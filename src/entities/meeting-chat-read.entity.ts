import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { User } from './user.entity';
import { Meeting } from './meeting.entity';
import { MeetingChat } from './meeting-chat.entity';

@Entity('meeting_chat_reads')
export class MeetingChatRead {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string = ulid();

  @Column({ type: 'varchar', length: 26, name: 'meeting_id' })
  meetingId: string;

  @Column({ type: 'varchar', length: 26, name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 26, name: 'chat_id' })
  chatId: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'read_at' })
  readAt: Date;

  // Relations
  @ManyToOne(() => Meeting, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => MeetingChat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat: MeetingChat;
}
