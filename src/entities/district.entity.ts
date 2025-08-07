import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ulid } from 'ulid';

@Entity('districts')
export class District {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar', length: 5, unique: true })
  @Index()
  regionCode: string;

  @Column({ type: 'varchar', length: 20 })
  districtName: string;

  @Column({ type: 'varchar', length: 20 })
  city: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor() {
    if (!this.id) {
      this.id = ulid();
    }
  }
}
