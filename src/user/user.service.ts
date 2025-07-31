import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 데이터 생성
  create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  // 모든 데이터 읽기
  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  // 특정 데이터 삭제
  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
