import { DataSource } from 'typeorm';
import * as winston from 'winston';
import { District } from '../../../entities';

const seoulDistricts = [
  {
    regionCode: '11110',
    districtName: '종로구',
    city: '서울특별시',
    latitude: 37.5735207,
    longitude: 126.9788418,
    isActive: false,
  },
  {
    regionCode: '11140',
    districtName: '중구',
    city: '서울특별시',
    latitude: 37.5640907,
    longitude: 126.9979879,
    isActive: false,
  },
  {
    regionCode: '11170',
    districtName: '용산구',
    city: '서울특별시',
    latitude: 37.5324,
    longitude: 126.9906,
    isActive: false,
  },
  {
    regionCode: '11200',
    districtName: '성동구',
    city: '서울특별시',
    latitude: 37.5634,
    longitude: 127.0371,
    isActive: false,
  },
  {
    regionCode: '11215',
    districtName: '광진구',
    city: '서울특별시',
    latitude: 37.5387,
    longitude: 127.0823,
    isActive: false,
  },
  {
    regionCode: '11230',
    districtName: '동대문구',
    city: '서울특별시',
    latitude: 37.5744,
    longitude: 127.0396,
    isActive: false,
  },
  {
    regionCode: '11260',
    districtName: '중랑구',
    city: '서울특별시',
    latitude: 37.6065,
    longitude: 127.0926,
    isActive: false,
  },
  {
    regionCode: '11290',
    districtName: '성북구',
    city: '서울특별시',
    latitude: 37.5894,
    longitude: 127.0167,
    isActive: false,
  },
  {
    regionCode: '11305',
    districtName: '강북구',
    city: '서울특별시',
    latitude: 37.6398,
    longitude: 127.0256,
    isActive: false,
  },
  {
    regionCode: '11320',
    districtName: '도봉구',
    city: '서울특별시',
    latitude: 37.6687,
    longitude: 127.0471,
    isActive: false,
  },
  {
    regionCode: '11350',
    districtName: '노원구',
    city: '서울특별시',
    latitude: 37.6542,
    longitude: 127.0568,
    isActive: false,
  },
  {
    regionCode: '11380',
    districtName: '은평구',
    city: '서울특별시',
    latitude: 37.6176,
    longitude: 126.9227,
    isActive: false,
  },
  {
    regionCode: '11410',
    districtName: '서대문구',
    city: '서울특별시',
    latitude: 37.5791,
    longitude: 126.9368,
    isActive: false,
  },
  {
    regionCode: '11440',
    districtName: '마포구',
    city: '서울특별시',
    latitude: 37.5663,
    longitude: 126.9016,
    isActive: false,
  },
  {
    regionCode: '11470',
    districtName: '양천구',
    city: '서울특별시',
    latitude: 37.517,
    longitude: 126.8662,
    isActive: false,
  },
  {
    regionCode: '11500',
    districtName: '강서구',
    city: '서울특별시',
    latitude: 37.5509,
    longitude: 126.8495,
    isActive: false,
  },
  {
    regionCode: '11530',
    districtName: '구로구',
    city: '서울특별시',
    latitude: 37.4954,
    longitude: 126.8874,
    isActive: false,
  },
  {
    regionCode: '11545',
    districtName: '금천구',
    city: '서울특별시',
    latitude: 37.4567,
    longitude: 126.8955,
    isActive: false,
  },
  {
    regionCode: '11560',
    districtName: '영등포구',
    city: '서울특별시',
    latitude: 37.5264,
    longitude: 126.8962,
    isActive: false,
  },
  {
    regionCode: '11590',
    districtName: '동작구',
    city: '서울특별시',
    latitude: 37.5124,
    longitude: 126.9393,
    isActive: false,
  },
  {
    regionCode: '11620',
    districtName: '관악구',
    city: '서울특별시',
    latitude: 37.4784,
    longitude: 126.9516,
    isActive: false,
  },
  {
    regionCode: '11650',
    districtName: '서초구',
    city: '서울특별시',
    latitude: 37.4837,
    longitude: 127.0327,
    isActive: false,
  },
  {
    regionCode: '11680',
    districtName: '강남구',
    city: '서울특별시',
    latitude: 37.5173,
    longitude: 127.0473,
    isActive: false,
  },
  {
    regionCode: '11710',
    districtName: '송파구',
    city: '서울특별시',
    latitude: 37.5145,
    longitude: 127.1056,
    isActive: true,
  },
  {
    regionCode: '11740',
    districtName: '강동구',
    city: '서울특별시',
    latitude: 37.5301,
    longitude: 127.1238,
    isActive: false,
  },
];

export const seedDistricts = async (
  dataSource: DataSource,
  logger: winston.Logger,
) => {
  const districtRepository = dataSource.getRepository(District);

  for (const districtData of seoulDistricts) {
    const existingDistrict = await districtRepository.findOne({
      where: { regionCode: districtData.regionCode },
    });

    if (!existingDistrict) {
      const district = districtRepository.create(districtData);
      await districtRepository.save(district);
      logger.info(`새 지역 생성: ${districtData.districtName}`);
    } else {
      existingDistrict.latitude = districtData.latitude;
      existingDistrict.longitude = districtData.longitude;
      await districtRepository.save(existingDistrict);
      logger.info(
        `지역 좌표 업데이트: ${districtData.districtName} (${districtData.latitude}, ${districtData.longitude})`,
      );
    }
  }
};
