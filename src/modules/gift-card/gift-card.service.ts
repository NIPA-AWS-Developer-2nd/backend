import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftCard, GiftCardCategory } from '../../entities/gift-card.entity';
import { GetGiftCardsQueryDto } from './dto/get-gift-cards-query.dto';

@Injectable()
export class GiftCardService {
  constructor(
    @InjectRepository(GiftCard)
    private readonly giftCardRepository: Repository<GiftCard>,
  ) {}

  async findAll(query: GetGiftCardsQueryDto) {
    const { category, brand, page = 1, limit = 20 } = query;

    const queryBuilder = this.giftCardRepository
      .createQueryBuilder('giftCard')
      .where('giftCard.isActive = :isActive', { isActive: true });

    if (category) {
      queryBuilder.andWhere('giftCard.category = :category', { category });
    }

    if (brand) {
      queryBuilder.andWhere('giftCard.brand ILIKE :brand', {
        brand: `%${brand}%`,
      });
    }

    const [items, totalElements] = await queryBuilder
      .orderBy('giftCard.brand', 'ASC')
      .addOrderBy('giftCard.points', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(totalElements / limit);

    return {
      page,
      size: limit,
      totalElements,
      totalPages,
      data: items,
    };
  }

  async findById(id: string): Promise<GiftCard | null> {
    return this.giftCardRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async findByCategory(category: GiftCardCategory): Promise<GiftCard[]> {
    return this.giftCardRepository.find({
      where: { category, isActive: true },
      order: { brand: 'ASC', points: 'ASC' },
    });
  }
}
