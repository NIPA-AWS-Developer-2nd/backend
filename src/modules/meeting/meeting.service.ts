import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Meeting, MissionParticipant } from '../../entities';
import { GetMeetingsQueryDto } from './dto/get-meetings-query.dto';
import { GetMeetingsResponseDto, MeetingDto } from './dto/meeting-response.dto';

@Injectable()
export class MeetingService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(MissionParticipant)
    private readonly participantRepository: Repository<MissionParticipant>,
  ) {}

  async getMeetings(
    query: GetMeetingsQueryDto,
  ): Promise<GetMeetingsResponseDto> {
    const queryBuilder = this.buildMeetingQuery(query);

    // 총 개수 조회
    const totalElements = await queryBuilder.getCount();

    // 페이지네이션 적용
    const { page = 1, size = 6 } = query;
    const skip = (page - 1) * size;

    queryBuilder.skip(skip).take(size);

    // 데이터 조회
    const meetings = await queryBuilder.getMany();

    // 각 모임의 현재 참여자 수 조회
    const meetingsWithParticipants = await Promise.all(
      meetings.map(async (meeting) => {
        const participantCount = await this.participantRepository.count({
          where: {
            meetingId: meeting.id,
            status: 'joined',
          },
        });

        return this.mapMeetingToDto(meeting, participantCount);
      }),
    );

    const totalPages = Math.ceil(totalElements / size);

    return {
      meetings: meetingsWithParticipants,
      page,
      size,
      totalElements,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  private buildMeetingQuery(
    query: GetMeetingsQueryDto,
  ): SelectQueryBuilder<Meeting> {
    const queryBuilder = this.meetingRepository
      .createQueryBuilder('meeting')
      .leftJoinAndSelect('meeting.mission', 'mission')
      .leftJoinAndSelect('mission.category', 'category')
      .leftJoinAndSelect('mission.district', 'district')
      .leftJoinAndSelect('meeting.host', 'host')
      .leftJoinAndSelect('host.profile', 'hostProfile');

    // 상태 필터
    if (query.status) {
      queryBuilder.andWhere('meeting.status = :status', {
        status: query.status,
      });
    }

    // 미션 ID 필터 (특정 미션의 모임만)
    if (query.missionId) {
      queryBuilder.andWhere('meeting.missionId = :missionId', {
        missionId: query.missionId,
      });
    }

    // 카테고리 필터
    if (query.categoryId) {
      queryBuilder.andWhere('mission.missionCategoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    // 지역구 필터
    if (query.districtId) {
      queryBuilder.andWhere('mission.districtId = :districtId', {
        districtId: query.districtId,
      });
    }

    // 난이도 필터
    if (query.difficulty) {
      queryBuilder.andWhere('mission.difficulty = :difficulty', {
        difficulty: query.difficulty,
      });
    }

    // 날짜 필터링
    this.applyDateFilters(queryBuilder, query);

    // 검색 키워드
    if (query.searchKeyword) {
      queryBuilder.andWhere(
        '(mission.title ILIKE :keyword OR mission.description ILIKE :keyword OR :keyword = ANY(mission.hashtags))',
        { keyword: `%${query.searchKeyword}%` },
      );
    }

    // 정렬
    this.applySorting(queryBuilder, query.sortBy);

    return queryBuilder;
  }

  private applyDateFilters(
    queryBuilder: SelectQueryBuilder<Meeting>,
    query: GetMeetingsQueryDto,
  ): void {
    // 특정 날짜 선택이 우선순위
    if (query.selectedDate) {
      const selectedDate = new Date(query.selectedDate);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        'meeting.scheduledAt >= :startOfDay AND meeting.scheduledAt <= :endOfDay',
        { startOfDay, endOfDay },
      );
    } else if (query.weekStartDate && query.weekEndDate) {
      // 주간 범위 필터
      queryBuilder.andWhere(
        'meeting.scheduledAt >= :weekStart AND meeting.scheduledAt <= :weekEnd',
        {
          weekStart: new Date(query.weekStartDate),
          weekEnd: new Date(query.weekEndDate),
        },
      );
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<Meeting>,
    sortBy?: string,
  ): void {
    switch (sortBy) {
      case 'deadline':
        queryBuilder.orderBy('meeting.recruitUntil', 'ASC');
        break;
      case 'popular':
        // 참여자 수로 정렬하려면 subquery 필요
        queryBuilder.orderBy('meeting.createdAt', 'DESC');
        break;
      case 'latest':
      default:
        queryBuilder.orderBy('meeting.createdAt', 'DESC');
        break;
    }
  }

  private mapMeetingToDto(
    meeting: Meeting,
    currentParticipants: number,
  ): MeetingDto {
    return {
      id: meeting.id,
      missionId: meeting.missionId,
      hostUserId: meeting.hostUserId,
      status: meeting.status,
      recruitUntil: meeting.recruitUntil.toISOString(),
      scheduledAt: meeting.scheduledAt.toISOString(),
      qrCodeToken: meeting.qrCodeToken,
      qrGeneratedAt: meeting.qrGeneratedAt?.toISOString(),
      createdAt: meeting.createdAt.toISOString(),
      updatedAt: meeting.updatedAt.toISOString(),
      currentParticipants,
      mission: meeting.mission
        ? {
            id: meeting.mission.id,
            title: meeting.mission.title,
            description: meeting.mission.description,
            minParticipants: meeting.mission.minParticipants,
            maxParticipants: meeting.mission.maxParticipants,
            estimatedDuration: meeting.mission.estimatedDuration,
            minimumDuration: meeting.mission.minimumDuration,
            basePoints: meeting.mission.basePoints,
            photoVerificationGuide: meeting.mission.photoVerificationGuide,
            sampleImageUrls: meeting.mission.sampleImageUrls,
            categoryId: meeting.mission.missionCategoryId,
            difficulty: meeting.mission.difficulty,
            thumbnailUrl: meeting.mission.thumbnailUrl,
            precautions: meeting.mission.precautions,
            districtId: meeting.mission.districtId,
            location: meeting.mission.location,
            hashtags: meeting.mission.hashtags,
            isActive: meeting.mission.isActive,
            createdAt: meeting.mission.createdAt.toISOString(),
            updatedAt: meeting.mission.updatedAt.toISOString(),
            category: meeting.mission.category
              ? {
                  id: meeting.mission.category.id,
                  name: meeting.mission.category.name,
                  slug: meeting.mission.category.slug,
                  isActive: meeting.mission.category.isActive,
                }
              : undefined,
            district: meeting.mission.district
              ? {
                  id: meeting.mission.district.id,
                  regionCode: meeting.mission.district.regionCode,
                  districtName: meeting.mission.district.districtName,
                  city: meeting.mission.district.city,
                  isActive: meeting.mission.district.isActive,
                }
              : undefined,
          }
        : undefined,
      host: meeting.host
        ? {
            id: meeting.host.id,
            nickname: meeting.host.profile?.nickname || '알 수 없음',
            profileImageUrl: meeting.host.profile?.profileImageUrl || '',
            points: meeting.host.rewards?.totalPoints || 0,
            level: meeting.host.rewards?.currentLevel || 1,
          }
        : undefined,
    };
  }
}
