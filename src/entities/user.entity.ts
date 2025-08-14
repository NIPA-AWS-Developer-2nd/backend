import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ulid } from 'ulid';
import { SocialAccount } from './social-account.entity';
import { UserProfile } from './user-profile.entity';
import { UserRewards } from './user-rewards.entity';
import { District } from './district.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index({ unique: true })
  phoneNumber: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  phoneVerifiedAt: Date | null;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLocationVerificationAt: Date | null;

  @Column({ type: 'varchar', length: 26, nullable: true })
  currentDistrictId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  onboardingCompletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => SocialAccount, (socialAccount) => socialAccount.user)
  socialAccounts?: SocialAccount[];

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile?: UserProfile;

  @OneToOne(() => UserRewards, (rewards) => rewards.user)
  rewards?: UserRewards;

  @ManyToOne(() => District)
  @JoinColumn({ name: 'currentDistrictId' })
  currentDistrict?: District;

  constructor() {
    if (!this.id) {
      this.id = ulid();
    }
  }
}
