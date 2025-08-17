import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { District } from './district.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 26, unique: true })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  nickname: string;

  @Column({ type: 'varchar', length: 512 })
  profileImageUrl: string;

  @Column({ type: 'int', array: true, default: () => "'{}'" })
  interestIds: number[];

  @Column({ type: 'int', array: true, default: () => "'{}'" })
  hashtagIds: number[];

  @Column({ type: 'varchar', length: 4, nullable: true })
  mbti: string | null;

  @Column({ type: 'varchar', length: 26, nullable: true })
  districtId: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  bio: string | null;

  @Column({ type: 'smallint', nullable: true })
  birthYear: number | null;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender | null;

  @Column({ type: 'int', default: 500 })
  points: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => District, { nullable: true })
  @JoinColumn({ name: 'districtId' })
  district: District | null;
}
