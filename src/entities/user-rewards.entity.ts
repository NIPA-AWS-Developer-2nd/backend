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

@Entity('user_rewards')
export class UserRewards {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 26, unique: true })
  userId: string;

  @Column({ type: 'int', default: 0 })
  aiMissionTickets: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
