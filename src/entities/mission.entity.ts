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
import { Category } from './category.entity';
import { District } from './district.entity';

export enum MissionDifficulty {
  VERY_EASY = 'very_easy',
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  VERY_HARD = 'very_hard',
}

@Entity('missions')
export class Mission {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'integer' })
  participants: number;

  @Column({ type: 'integer' })
  estimatedDuration: number;

  @Column({ type: 'integer' })
  minimumDuration: number;

  @Column({ type: 'integer' })
  basePoints: number;

  @Column({ type: 'text' })
  photoVerificationGuide: string;

  @Column({ type: 'varchar', length: 512, array: true, default: '{}' })
  sampleImageUrls: string[];

  @Column({ type: 'integer' })
  missionCategoryId: number;

  @Column({
    type: 'enum',
    enum: MissionDifficulty,
  })
  difficulty: MissionDifficulty;

  @Column({ type: 'varchar', length: 512 })
  thumbnailUrl: string;

  @Column({
    type: 'varchar',
    length: 200,
    array: true,
    default: '{}',
    nullable: true,
  })
  precautions: string[];

  @Column({ type: 'varchar', length: 26 })
  districtId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    array: true,
    default: '{}',
    nullable: true,
  })
  hashtags: string[];

  @Column({ type: 'integer', default: 0 })
  hostStakePoints: number;

  @Column({ type: 'integer', default: 0 })
  participantStakePoints: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'missionCategoryId' })
  category?: Category;

  @ManyToOne(() => District)
  @JoinColumn({ name: 'districtId' })
  district?: District;

  constructor() {
    if (!this.id) {
      this.id = ulid();
    }
  }
}
