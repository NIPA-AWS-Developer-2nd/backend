import { DataSource } from 'typeorm';
import * as winston from 'winston';
import { UserInterests, UserHashtags } from '../../../entities';

const userInterests = [
  { name: '맛집 투어', slug: 'food_tour', icon: '🍽️' },
  { name: '액티비티', slug: 'activity', icon: '🏃' },
  { name: '여행', slug: 'travel', icon: '✈️' },
  { name: '음악', slug: 'music', icon: '🎵' },
  { name: '패션', slug: 'fashion', icon: '👗' },
  { name: '오락', slug: 'entertainment', icon: '🎮' },
  { name: '전시/공연', slug: 'exhibition', icon: '🎨' },
  { name: '봉사활동', slug: 'volunteer', icon: '❤️' },
  { name: '반려동물', slug: 'pets', icon: '🐕' },
  { name: '카페', slug: 'cafe', icon: '☕' },
  { name: '사진', slug: 'photography', icon: '📷' },
  { name: '영화', slug: 'movie', icon: '🎬' },
];

const userHashtags = [
  { name: '#웃음이넘치는' },
  { name: '#열정적인' },
  { name: '#차분한' },
  { name: '#긍정적인' },
  { name: '#활동적인' },
  { name: '#자유로운' },
  { name: '#진지한' },
  { name: '#활발한' },
  { name: '#창의적인' },
  { name: '#수다를좋아하는' },
  { name: '#점잖은' },
  { name: '#현실적인' },
  { name: '#공감능력' },
  { name: '#도전적인' },
  { name: '#섬세한' },
];

export const seedUserPreferences = async (
  dataSource: DataSource,
  logger: winston.Logger,
) => {
  const userInterestsRepository = dataSource.getRepository(UserInterests);
  const userHashtagsRepository = dataSource.getRepository(UserHashtags);

  for (const interestData of userInterests) {
    const existingInterest = await userInterestsRepository.findOne({
      where: { slug: interestData.slug },
    });

    if (!existingInterest) {
      const interest = userInterestsRepository.create(interestData);
      await userInterestsRepository.save(interest);
      logger.info(`관심사 생성: ${interestData.name}`);
    }
  }

  for (const hashtagData of userHashtags) {
    const existingHashtag = await userHashtagsRepository.findOne({
      where: { name: hashtagData.name },
    });

    if (!existingHashtag) {
      const hashtag = userHashtagsRepository.create(hashtagData);
      await userHashtagsRepository.save(hashtag);
      logger.info(`해시태그 생성: ${hashtagData.name}`);
    }
  }
};
