import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission, MissionDifficulty } from '../../entities/mission.entity';
import {
  GetMissionsQueryDto,
  DifficultyEnum,
} from './dto/get-missions-query.dto';

@Injectable()
export class MissionService {
  constructor(
    @InjectRepository(Mission)
    private readonly missionRepository: Repository<Mission>,
  ) {}

  async findAll(query: GetMissionsQueryDto) {
    const {
      category,
      difficulty,
      participants,
      duration,
      point,
      page = 1,
      limit = 5,
    } = query;

    const queryBuilder = this.missionRepository
      .createQueryBuilder('mission')
      .leftJoinAndSelect('mission.category', 'category')
      .leftJoinAndSelect('mission.district', 'district')
      .where('mission.isActive = :isActive', { isActive: true })
      .orderBy('mission.basePoints', 'DESC');

    // 카테고리 필터 (slug 사용)
    if (category && category !== 'all') {
      queryBuilder.andWhere('category.slug = :category', { category });
    }

    // 난이도 필터 (enum 값 매핑)
    if (difficulty) {
      let mappedDifficulty: MissionDifficulty;
      switch (difficulty) {
        case DifficultyEnum.EASY:
          mappedDifficulty = MissionDifficulty.EASY;
          break;
        case DifficultyEnum.MEDIUM:
          mappedDifficulty = MissionDifficulty.MEDIUM;
          break;
        case DifficultyEnum.HARD:
          mappedDifficulty = MissionDifficulty.HARD;
          break;
        default:
          mappedDifficulty = MissionDifficulty.MEDIUM;
      }
      queryBuilder.andWhere('mission.difficulty = :difficulty', {
        difficulty: mappedDifficulty,
      });
    }

    // 참여인원 필터
    if (participants) {
      switch (participants) {
        case 'medium':
          queryBuilder.andWhere('mission.maxParticipants BETWEEN 4 AND 6');
          break;
        case 'large':
          queryBuilder.andWhere('mission.maxParticipants > 6');
          break;
      }
    }

    // 예상시간 필터
    if (duration) {
      switch (duration) {
        case 'short':
          queryBuilder.andWhere('mission.estimatedDuration <= 90');
          break;
        case 'medium':
          queryBuilder.andWhere(
            'mission.estimatedDuration > 90 AND mission.estimatedDuration <= 180',
          );
          break;
        case 'long':
          queryBuilder.andWhere('mission.estimatedDuration > 180');
          break;
      }
    }

    // 포인트 범위 필터
    if (point) {
      switch (point) {
        case 'low':
          queryBuilder.andWhere('mission.basePoints < 400');
          break;
        case 'medium':
          queryBuilder.andWhere(
            'mission.basePoints >= 400 AND mission.basePoints < 800',
          );
          break;
        case 'high':
          queryBuilder.andWhere('mission.basePoints >= 800');
          break;
      }
    }

    // 페이지네이션
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // 총 개수와 데이터 조회
    const [missions, totalItems] = await queryBuilder.getManyAndCount();

    // 응답 포맷 맞추기
    const formattedMissions = missions.map((mission) => ({
      id: mission.id,
      title: mission.title,
      description: mission.description,
      thumbnailUrl: mission.thumbnailUrl,
      point: mission.basePoints,
      difficulty: mission.difficulty.toUpperCase(), // EASY, MEDIUM, HARD
      duration: mission.estimatedDuration,
      minParticipants: mission.minParticipants,
      maxParticipants: mission.maxParticipants,
      category: mission.category ? [mission.category.slug] : [],
      isActive: mission.isActive,
      createdAt: mission.createdAt,
      updatedAt: mission.updatedAt,
    }));

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      missions: formattedMissions,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async findOne(id: string): Promise<{
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    point: number;
    difficulty: string;
    duration: number;
    minParticipants: number;
    maxParticipants: number;
    minDuration: number;
    minPhotoCount: number;
    region_code: string;
    category: string[];
    status: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    const mission = await this.missionRepository
      .createQueryBuilder('mission')
      .leftJoinAndSelect('mission.category', 'category')
      .leftJoinAndSelect('mission.district', 'district')
      .where('mission.id = :id', { id })
      .andWhere('mission.isActive = :isActive', { isActive: true })
      .getOne();

    if (!mission) {
      return null;
    }

    return {
      id: mission.id,
      title: mission.title,
      description: mission.description,
      thumbnailUrl: mission.thumbnailUrl,
      point: mission.basePoints,
      difficulty: mission.difficulty.toUpperCase(),
      duration: mission.estimatedDuration,
      minParticipants: mission.minParticipants,
      maxParticipants: mission.maxParticipants,
      minDuration: mission.minimumDuration,
      minPhotoCount: 1,
      region_code: mission.district?.regionCode || '',
      category: mission.category ? [mission.category.slug] : [],
      status: mission.isActive ? 'ACTIVE' : 'INACTIVE',
      createdBy: 'admin',
      createdAt: mission.createdAt,
      updatedAt: mission.updatedAt,
    };
  }
}
