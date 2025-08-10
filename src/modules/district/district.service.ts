import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { District } from '../../entities';

@Injectable()
export class DistrictService {
  constructor(
    @InjectRepository(District)
    private districtRepository: Repository<District>,
  ) {}

  async findAll(): Promise<District[]> {
    return this.districtRepository.find({
      where: { isActive: true },
      order: { city: 'ASC', districtName: 'ASC' },
    });
  }

  async findByCity(): Promise<{ [city: string]: District[] }> {
    const districts = await this.findAll();

    const groupedByCity: { [city: string]: District[] } = {};

    districts.forEach((district) => {
      if (!groupedByCity[district.city]) {
        groupedByCity[district.city] = [];
      }
      groupedByCity[district.city].push(district);
    });

    return groupedByCity;
  }
}
