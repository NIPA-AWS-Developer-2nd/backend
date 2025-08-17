import { DataSource } from 'typeorm';
import * as winston from 'winston';
import { Category } from '../../../entities';

const categories = [
  { name: '음식', slug: 'food', icon: 'Utensils' },
  { name: '문화/예술', slug: 'culture', icon: 'Palette' },
  { name: '카페', slug: 'cafe', icon: 'Coffee' },
  { name: '스포츠', slug: 'sports', icon: 'Dumbbell' },
  { name: '게임', slug: 'gaming', icon: 'Gamepad2' },
  { name: '사진', slug: 'photo', icon: 'Camera' },
  { name: '쇼핑', slug: 'shopping', icon: 'ShoppingBag' },
  { name: '음악', slug: 'music', icon: 'Music' },
  { name: '봉사활동', slug: 'volunteer_work', icon: 'Heart' },
  { name: '여행', slug: 'travel', icon: 'Plane' },
  { name: '반려동물', slug: 'pets', icon: 'Cat' },
];

export const seedCategories = async (
  dataSource: DataSource,
  logger: winston.Logger,
) => {
  const categoryRepository = dataSource.getRepository(Category);

  for (const categoryData of categories) {
    const existingCategory = await categoryRepository.findOne({
      where: { slug: categoryData.slug },
    });

    if (!existingCategory) {
      const category = categoryRepository.create(categoryData);
      await categoryRepository.save(category);
      logger.info(`카테고리 생성: ${categoryData.name}`);
    }
  }
};
