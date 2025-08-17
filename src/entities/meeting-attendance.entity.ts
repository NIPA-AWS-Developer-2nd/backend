import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ulid } from 'ulid';
import { User } from './user.entity';
import { Meeting } from './meeting.entity';

export enum AttendanceStatus {
  CHECKED_IN = 'checked_in',
  NO_SHOW = 'no_show',
  EXCUSED = 'excused',
}

@Entity('meeting_attendances')
@Unique(['meetingId', 'userId'])
export class MeetingAttendance {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string = ulid();

  @Column({ type: 'varchar', length: 26 })
  meetingId: string;

  @Column({ type: 'varchar', length: 26 })
  userId: string;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    nullable: true,
  })
  status: AttendanceStatus;

  @Column({ type: 'timestamptz', nullable: true })
  checkedInAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  noShowMarkedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string; // 출석 관련 특이사항

  @Column({ type: 'json', nullable: true })
  verification: Record<string, any>; // QR 코드, 위치 등 인증 정보

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Meeting)
  @JoinColumn({ name: 'meetingId' })
  meeting: Meeting;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
