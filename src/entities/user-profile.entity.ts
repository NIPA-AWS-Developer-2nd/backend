import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
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
  categoryIds: number[];

  @Column({ type: 'varchar', length: 4, nullable: true })
  mbti: string;

  @Column({ type: 'varchar', length: 5 })
  districtId: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  bio: string;

  @Column({ type: 'int' })
  birthYear: number;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender: Gender;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'int', default: 1 })
  level: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
