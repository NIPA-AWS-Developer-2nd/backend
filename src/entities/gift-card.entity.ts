import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ulid } from 'ulid';

export enum GiftCardCategory {
  COFFEE_BEVERAGE = 'coffee_beverage',
  CHICKEN = 'chicken',
  FAST_FOOD = 'fast_food',
  CONVENIENCE = 'convenience',
  FASHION = 'fashion',
  BEAUTY = 'beauty',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other',
}

@Entity('gift_cards')
export class GiftCard {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  brand: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'int' })
  points: number;

  @Column({ type: 'text' })
  imageUrl: string;

  @Column({
    type: 'enum',
    enum: GiftCardCategory,
    default: GiftCardCategory.OTHER,
  })
  @Index()
  category: GiftCardCategory;

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
