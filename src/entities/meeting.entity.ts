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

export enum MeetingStatus {
  RECRUITING = 'recruiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
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

  @Column({ type: 'integer', nullable: true })
  maxParticipants: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  qrCodeToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  qrGeneratedAt: Date | null;

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
  participants?: MeetingParticipant[];

  @OneToOne(() => MeetingProfile, (profile) => profile.meeting)
  profile?: MeetingProfile;

  constructor() {
    if (!this.id) {
      this.id = ulid();
    }
  }
}
