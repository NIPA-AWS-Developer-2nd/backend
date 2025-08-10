import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInterests } from '../../entities';

@Injectable()
export class UserInterestsService {
  constructor(
    @InjectRepository(UserInterests)
    private userInterestsRepository: Repository<UserInterests>,
  ) {}

  async findAll(): Promise<UserInterests[]> {
    return this.userInterestsRepository.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }
}
