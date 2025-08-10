import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserHashtags } from '../../entities';

@Injectable()
export class UserHashtagsService {
  constructor(
    @InjectRepository(UserHashtags)
    private userHashtagsRepository: Repository<UserHashtags>,
  ) {}

  async findAll(): Promise<UserHashtags[]> {
    return this.userHashtagsRepository.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }
}
