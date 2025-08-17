import { GiftCard, GiftCardCategory } from '../../../entities/gift-card.entity';

export const giftCardsData: Partial<GiftCard>[] = [
  {
    brand: '스타벅스',
    name: '아이스 카페 아메리카노 T',
    points: 19950,
    imageUrl:
      'https://cdn.giftistar.net/upload/2023_11_16_102137627_5c600b4ef9f74bcc91c4d5912a82f615.png/500x',
    category: GiftCardCategory.COFFEE_BEVERAGE,
    isActive: true,
  },
  {
    brand: '메가커피',
    name: 'ICE 아메리카노',
    points: 8500,
    imageUrl:
      'https://cdn.giftistar.net/upload/2023_11_16_090044418_e80e578e960c447992b21121d15667f7.png/500x',
    category: GiftCardCategory.COFFEE_BEVERAGE,
    isActive: true,
  },
  {
    brand: '컴포즈커피',
    name: '아메리카노(Ice)(TAKE-OUT)',
    points: 7800,
    imageUrl:
      'https://cdn.giftistar.net/upload/2023_11_16_090931554_62a07c40bf0c4e648bce3b7a5c2059d4.png/500x',
    category: GiftCardCategory.COFFEE_BEVERAGE,
    isActive: true,
  },
  {
    brand: '컴포즈커피',
    name: '아메리카노HOT',
    points: 6500,
    imageUrl:
      'https://cdn.giftistar.net/upload/2023_11_16_093811401_094b9e944e7748e185cab86b464333da.png/500x',
    category: GiftCardCategory.COFFEE_BEVERAGE,
    isActive: true,
  },
  {
    brand: '빽다방',
    name: '아메리카노(ICED)',
    points: 9200,
    imageUrl:
      'https://cdn.giftistar.net/upload/2023_11_16_090909090_e2795642b19a4e29b41776b7909d7712.png/500x',
    category: GiftCardCategory.COFFEE_BEVERAGE,
    isActive: true,
  },
  {
    brand: '메가커피',
    name: 'HOT 아메리카노',
    points: 7050,
    imageUrl:
      'https://cdn.giftistar.net/user-upload/2025_04_21_091008298_8ae9ad7d4a3f459593d516531e6d3f8c.png/500x',
    category: GiftCardCategory.COFFEE_BEVERAGE,
    isActive: true,
  },
  {
    brand: '투썸플레이스',
    name: '아메리카노 (R)',
    points: 21650,
    imageUrl:
      'https://cdn.giftistar.net/upload/2023_11_16_090439241_6108dcb5f2384cf89bddb0f40001829d.png/500x',
    category: GiftCardCategory.COFFEE_BEVERAGE,
    isActive: true,
  },
  // 마트/편의점
  {
    brand: 'CU',
    name: '1천원권',
    points: 4750,
    imageUrl:
      'https://cdn.giftistar.net/user-upload/2025_02_08_130508177_8da407cb810841afb1ca26572870c14d.png/500x',
    category: GiftCardCategory.CONVENIENCE,
    isActive: true,
  },
  {
    brand: 'CU',
    name: '5천원권',
    points: 23750,
    imageUrl:
      'https://cdn.giftistar.net/upload/2023_12_06_155407341_0626cfc7c5044ef0b13d3bc5d36b4bc2.png/500x',
    category: GiftCardCategory.CONVENIENCE,
    isActive: true,
  },
  {
    brand: 'GS25',
    name: '빙그레 바나나맛우유 240ML',
    points: 7300,
    imageUrl:
      'https://cdn.giftistar.net/upload/2024_11_09_075713285_afd50eea02d0428d9444184a61e192bd.png/500x',
    category: GiftCardCategory.CONVENIENCE,
    isActive: true,
  },
  {
    brand: 'CU',
    name: '2천원권',
    points: 9500,
    imageUrl:
      'https://cdn.giftistar.net/user-upload/2025_02_08_130527653_1c8e0f07d5b5413891bb1100b21953a4.png/500x',
    category: GiftCardCategory.CONVENIENCE,
    isActive: true,
  },
  {
    brand: 'CU',
    name: '3천원권',
    points: 14250,
    imageUrl:
      'https://cdn.giftistar.net/user-upload/2025_02_08_130522054_56ad994d6e4e4006860663c91116d5f9.png/500x',
    category: GiftCardCategory.CONVENIENCE,
    isActive: true,
  },
  {
    brand: 'CU',
    name: '1만원권',
    points: 48000,
    imageUrl:
      'https://cdn.giftistar.net/user-upload/2025_02_08_130455117_f328328119714c26bf8d10e23aa8862d.png/500x',
    category: GiftCardCategory.CONVENIENCE,
    isActive: true,
  },
  // 치킨
  {
    brand: 'BBQ치킨',
    name: '황금올리브치킨+콜라 1.25L',
    points: 101700,
    imageUrl:
      'https://cdn.giftistar.net/user-upload/2025_06_30_084533686_5ab3000c3c3d4f978bf845c2877911fe.png/500x',
    category: GiftCardCategory.CHICKEN,
    isActive: true,
  },
  {
    brand: '교촌치킨',
    name: '간장 한마리(오리지날)+콜라 1.25L',
    points: 95550,
    imageUrl:
      'https://cdn.giftistar.net/user-upload/2025_06_02_082232595_68ac4994d3f74310a5884b4f814f4cb4.png/500x',
    category: GiftCardCategory.CHICKEN,
    isActive: true,
  },
  {
    brand: '교촌치킨',
    name: '허니콤보+콜라 1.25L',
    points: 118300,
    imageUrl:
      'https://cdn.giftistar.net/upload/2023_11_17_091959580_4b18fdd3192f419290f133440ce1a78c.png/500x',
    category: GiftCardCategory.CHICKEN,
    isActive: true,
  },
  {
    brand: 'BHC치킨',
    name: '뿌링클+콜라 1.25L',
    points: 97300,
    imageUrl:
      'https://cdn.giftistar.net/upload/2024_01_29_093122612_d90944fc924146f9af4cde67c4ff1aa0.png/500x',
    category: GiftCardCategory.CHICKEN,
    isActive: true,
  },
  {
    brand: 'BHC치킨',
    name: '후라이드+콜라 1.25L',
    points: 92850,
    imageUrl:
      'https://cdn.giftistar.net/user-upload/2025_01_16_115957076_aa769503a7484761bf6393e03118bfb2.png/500x',
    category: GiftCardCategory.CHICKEN,
    isActive: true,
  },
  {
    brand: '굽네치킨',
    name: '고추바사삭+콜라 1.25L',
    points: 95800,
    imageUrl:
      'https://cdn.giftistar.net/upload/2024_04_17_082511685_4c331e9e423b47ea974abf8d90bab409.png/500x',
    category: GiftCardCategory.CHICKEN,
    isActive: true,
  },
  // 패스트푸드
  {
    brand: '롯데리아',
    name: '데리버거 (단품)',
    points: 13100,
    imageUrl:
      'https://cdn.giftistar.net/upload/2023_11_16_094029302_42865a8d5cc149a9bb8730065fe35399.png/500x',
    category: GiftCardCategory.FAST_FOOD,
    isActive: true,
  },
  {
    brand: '롯데리아',
    name: '핫크리스피치킨버거 세트',
    points: 35650,
    imageUrl:
      'https://cdn.giftistar.net/upload/2023_11_16_093909466_ee43d1d0dd0b41ba9e62371e0366f7f2.png/500x',
    category: GiftCardCategory.FAST_FOOD,
    isActive: true,
  },
  {
    brand: '롯데리아',
    name: '리아 새우 세트',
    points: 31750,
    imageUrl:
      'https://cdn.giftistar.net/upload/2023_11_16_095214959_93c7278e7e024bfaa2cba33fc7155d66.png/500x',
    category: GiftCardCategory.FAST_FOOD,
    isActive: true,
  },
  {
    brand: '맥도날드',
    name: '빅맥세트',
    points: 32850,
    imageUrl:
      'https://cdn.giftistar.net/upload/2023_11_16_095722579_81e663375e3943eda87c48767bd29a1e.png/500x',
    category: GiftCardCategory.FAST_FOOD,
    isActive: true,
  },
  {
    brand: '맘스터치',
    name: '싸이버거 세트',
    points: 35000,
    imageUrl:
      'https://cdn.giftistar.net/upload/2023_11_16_092720786_f72e0786abd14c8d8e4e0cb6dcbf0630.png/500x',
    category: GiftCardCategory.FAST_FOOD,
    isActive: true,
  },
  {
    brand: '롯데리아',
    name: '리아 새우 (단품)',
    points: 21400,
    imageUrl:
      'https://cdn.giftistar.net/upload/2023_11_17_092029055_4403ec4e3c1f4c029de002583d52d97b.png/500x',
    category: GiftCardCategory.FAST_FOOD,
    isActive: true,
  },
];

export const seedGiftCards = async (giftCardRepository: any): Promise<void> => {
  for (const giftCardData of giftCardsData) {
    const existingGiftCard = await giftCardRepository.findOne({
      where: { brand: giftCardData.brand, name: giftCardData.name },
    });

    if (!existingGiftCard) {
      const giftCard = giftCardRepository.create(giftCardData);
      await giftCardRepository.save(giftCard);
    }
  }
};
