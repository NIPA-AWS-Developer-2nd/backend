import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum TraitPreference {
  PREFERRED = 'preferred',
  VOID = 'void',
}

@Entity('meeting_profile_traits')
export class MeetingProfileTrait {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  meetingId: string;

  @Column({ type: 'integer' })
  hashtagId: number;

  @Column({
    type: 'enum',
    enum: TraitPreference,
  })
  preference: TraitPreference;

  @Column({ type: 'smallint', default: 70 })
  weight: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
