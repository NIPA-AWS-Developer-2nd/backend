import { DataSource } from 'typeorm';
import * as winston from 'winston';
import { District, Category, Level } from '../../entities';

export const seedInitialData = async (dataSource: DataSource) => {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message }) => {
        return `[${String(timestamp)}] ${String(level)}: ${String(message)}`;
      }),
    ),
    transports: [new winston.transports.Console()],
  });
  const districtRepository = dataSource.getRepository(District);
  const categoryRepository = dataSource.getRepository(Category);
  const levelRepository = dataSource.getRepository(Level);

  // 서울 구 데이터 시딩
  const seoulDistricts = [
    { regionCode: '11110', districtName: '종로구', city: '서울특별시' },
    { regionCode: '11140', districtName: '중구', city: '서울특별시' },
    { regionCode: '11170', districtName: '용산구', city: '서울특별시' },
    { regionCode: '11200', districtName: '성동구', city: '서울특별시' },
    { regionCode: '11215', districtName: '광진구', city: '서울특별시' },
    { regionCode: '11230', districtName: '동대문구', city: '서울특별시' },
    { regionCode: '11260', districtName: '중랑구', city: '서울특별시' },
    { regionCode: '11290', districtName: '성북구', city: '서울특별시' },
    { regionCode: '11305', districtName: '강북구', city: '서울특별시' },
    { regionCode: '11320', districtName: '도봉구', city: '서울특별시' },
    { regionCode: '11350', districtName: '노원구', city: '서울특별시' },
    { regionCode: '11380', districtName: '은평구', city: '서울특별시' },
    { regionCode: '11410', districtName: '서대문구', city: '서울특별시' },
    { regionCode: '11440', districtName: '마포구', city: '서울특별시' },
    { regionCode: '11470', districtName: '양천구', city: '서울특별시' },
    { regionCode: '11500', districtName: '강서구', city: '서울특별시' },
    { regionCode: '11530', districtName: '구로구', city: '서울특별시' },
    { regionCode: '11545', districtName: '금천구', city: '서울특별시' },
    { regionCode: '11560', districtName: '영등포구', city: '서울특별시' },
    { regionCode: '11590', districtName: '동작구', city: '서울특별시' },
    { regionCode: '11620', districtName: '관악구', city: '서울특별시' },
    { regionCode: '11650', districtName: '서초구', city: '서울특별시' },
    { regionCode: '11680', districtName: '강남구', city: '서울특별시' },
    { regionCode: '11710', districtName: '송파구', city: '서울특별시' },
    { regionCode: '11740', districtName: '강동구', city: '서울특별시' },
  ];

  // 기존 지역 데이터 확인 후 없으면 생성
  for (const districtData of seoulDistricts) {
    const existingDistrict = await districtRepository.findOne({
      where: { regionCode: districtData.regionCode },
    });

    if (!existingDistrict) {
      const district = districtRepository.create(districtData);
      await districtRepository.save(district);
    }
  }

  // 카테고리 데이터 시딩
  const categories = [
    { name: '음식', slug: 'food' },
    { name: '문화/예술', slug: 'culture' },
    { name: '카페', slug: 'cafe' },
    { name: '스포츠', slug: 'sports' },
    { name: '게임', slug: 'gaming' },
    { name: '사진', slug: 'photo' },
    { name: '쇼핑', slug: 'shopping' },
    { name: '음악', slug: 'music' },
    { name: '봉사활동', slug: 'volunteer_work' },
    { name: '여행', slug: 'travel' },
    { name: '반려동물', slug: 'volunteer' },
  ];

  for (const categoryData of categories) {
    const existingCategory = await categoryRepository.findOne({
      where: { slug: categoryData.slug },
    });

    if (!existingCategory) {
      const category = categoryRepository.create(categoryData);
      await categoryRepository.save(category);
    }
  }

  // 레벨 시스템 데이터 시딩
  const levels = [
    { requiredPoints: 0, name: '1', rewardAiTickets: 0 },
    { requiredPoints: 200, name: '2', rewardAiTickets: 1 },
    { requiredPoints: 450, name: '3', rewardAiTickets: 1 },
    { requiredPoints: 750, name: '4', rewardAiTickets: 1 },
    { requiredPoints: 1100, name: '5', rewardAiTickets: 1 },
    { requiredPoints: 1500, name: '6', rewardAiTickets: 1 },
    { requiredPoints: 1950, name: '7', rewardAiTickets: 1 },
    { requiredPoints: 2450, name: '8', rewardAiTickets: 1 },
    { requiredPoints: 3000, name: '9', rewardAiTickets: 1 },
    { requiredPoints: 3600, name: '10', rewardAiTickets: 1 },
    { requiredPoints: 4300, name: '11', rewardAiTickets: 1 },
    { requiredPoints: 5100, name: '12', rewardAiTickets: 1 },
    { requiredPoints: 6000, name: '13', rewardAiTickets: 2 },
    { requiredPoints: 7000, name: '14', rewardAiTickets: 2 },
    { requiredPoints: 8150, name: '15', rewardAiTickets: 2 },
    { requiredPoints: 9450, name: '16', rewardAiTickets: 2 },
    { requiredPoints: 10900, name: '17', rewardAiTickets: 2 },
    { requiredPoints: 12500, name: '18', rewardAiTickets: 2 },
    { requiredPoints: 14250, name: '19', rewardAiTickets: 2 },
    { requiredPoints: 16150, name: '20', rewardAiTickets: 3 },
    { requiredPoints: 18200, name: '21', rewardAiTickets: 3 },
    { requiredPoints: 20400, name: '22', rewardAiTickets: 3 },
    { requiredPoints: 22750, name: '23', rewardAiTickets: 4 },
    { requiredPoints: 25250, name: '24', rewardAiTickets: 4 },
    { requiredPoints: 27900, name: '25', rewardAiTickets: 4 },
    { requiredPoints: 30700, name: '26', rewardAiTickets: 5 },
    { requiredPoints: 33650, name: '27', rewardAiTickets: 5 },
    { requiredPoints: 36750, name: '28', rewardAiTickets: 6 },
    { requiredPoints: 40000, name: '29', rewardAiTickets: 6 },
    { requiredPoints: 43400, name: '30', rewardAiTickets: 7 },
  ];

  for (const levelData of levels) {
    const existingLevel = await levelRepository.findOne({
      where: { requiredPoints: levelData.requiredPoints },
    });

    if (!existingLevel) {
      const level = levelRepository.create(levelData);
      await levelRepository.save(level);
    }
  }

  logger.info('🌱 Initial data seeding has been completed.');
};
