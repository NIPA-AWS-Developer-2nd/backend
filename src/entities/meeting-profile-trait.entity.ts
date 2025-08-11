import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MeetingProfile } from './meeting-profile.entity';

export enum TraitPreference {
  PREFERRED = 'preferred',
  VOID = 'void',
}

@Entity('meeting_profile_traits')
export class MeetingProfileTrait {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 26 })
  meetingId: string;

  @Column({ type: 'varchar', length: 26 })
  hashtagId: string;

  @Column({
    type: 'enum',
    enum: TraitPreference,
  })
  preference: TraitPreference;

  @Column({ type: 'smallint', default: 70 })
  weight: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => MeetingProfile, (profile) => profile.traits)
  @JoinColumn({ name: 'meetingId' })
  meetingProfile?: MeetingProfile;
}
