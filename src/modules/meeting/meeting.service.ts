import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, DataSource } from 'typeorm';
import {
  Meeting,
  MeetingParticipant,
  ParticipantStatus,
  Mission,
  MeetingProfile,
  MeetingProfileTrait,
  TraitPreference,
  MeetingLike,
} from '../../entities';
import { MeetingStatus } from '../../entities/meeting.entity';
import { GetMeetingsQueryDto } from './dto/get-meetings-query.dto';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import {
  GetMeetingsResponseDto,
  MeetingDto,
  MeetingDetailDto,
  MeetingParticipantDto,
} from './dto/meeting-response.dto';
import { MeetingSchedulerService } from '../scheduler/meeting-scheduler.service';
import { PointService } from '../point/point.service';
import { MeetingNotificationHelper } from '../notification/helpers/meeting-notification.helper';

@Injectable()
export class MeetingService {
  private readonly logger = new Logger(MeetingService.name);

  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(MeetingParticipant)
    private readonly participantRepository: Repository<MeetingParticipant>,
    @InjectRepository(Mission)
    private readonly missionRepository: Repository<Mission>,
    @InjectRepository(MeetingProfile)
    private readonly meetingProfileRepository: Repository<MeetingProfile>,
    @InjectRepository(MeetingProfileTrait)
    private readonly meetingProfileTraitRepository: Repository<MeetingProfileTrait>,
    @InjectRepository(MeetingLike)
    private readonly meetingLikeRepository: Repository<MeetingLike>,
    private readonly dataSource: DataSource,
    private readonly schedulerService: MeetingSchedulerService,
    private readonly pointService: PointService,
    private readonly meetingNotificationHelper: MeetingNotificationHelper,
  ) {}

  async getMeetings(
    query: GetMeetingsQueryDto,
    userId?: string,
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

    // 각 모임의 현재 참여자 수와 참여자 정보 조회
    const meetingsWithParticipants = await Promise.all(
      meetings.map(async (meeting) => {
        const participantCount = await this.participantRepository.count({
          where: {
            meetingId: meeting.id,
            status: ParticipantStatus.JOINED,
          },
        });

        // 참여자 프로필 정보 조회 (모든 참여자 조회하여 meJoined 확인용)
        const allParticipants = await this.participantRepository
          .createQueryBuilder('participant')
          .leftJoinAndSelect('participant.user', 'user')
          .leftJoinAndSelect('user.profile', 'profile')
          .where('participant.meetingId = :meetingId', {
            meetingId: meeting.id,
          })
          .andWhere('participant.status = :status', {
            status: ParticipantStatus.JOINED,
          })
          .orderBy('participant.createdAt', 'ASC')
          .getMany();

        // 리스트용으로는 최대 4명만
        const participants = allParticipants.slice(0, 4);

        // 사용자가 로그인된 경우 좋아요 상태 확인
        let isLiked = false;
        if (userId) {
          const likeExists = await this.meetingLikeRepository.findOne({
            where: { meetingId: meeting.id, userId },
          });
          isLiked = !!likeExists;
        }

        return this.mapMeetingToDto(
          meeting,
          participantCount,
          allParticipants,
          isLiked,
          userId,
        );
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
      .leftJoinAndSelect('host.profile', 'hostProfile')
      .leftJoinAndSelect('host.rewards', 'hostRewards');

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

  async createMeeting(
    hostUserId: string,
    createMeetingDto: CreateMeetingDto,
  ): Promise<MeetingDetailDto> {
    const {
      missionId,
      scheduledAt,
      participants,
      introduction,
      focusScore,
      traits,
    } = createMeetingDto;

    // 미션 존재 확인
    const mission = await this.missionRepository.findOne({
      where: { id: missionId, isActive: true },
    });

    if (!mission) {
      throw new NotFoundException('존재하지 않는 미션입니다.');
    }

    // 모집 마감일 자동 설정 (생성 날짜의 다음날 23:59:59, 새벽 6시 기준)
    const now = new Date();
    const currentHour = now.getHours();

    const baseDate = new Date(now);
    // 새벽 6시 이전이면 전날로 간주
    if (currentHour < 6) {
      baseDate.setDate(baseDate.getDate() - 1);
    }

    // 다음날 23:59:59으로 설정
    const recruitUntilDate = new Date(baseDate);
    recruitUntilDate.setDate(recruitUntilDate.getDate() + 1);
    recruitUntilDate.setHours(23, 59, 59, 999);

    // 미션 수행일 유효성 검증
    const scheduledAtDate = new Date(scheduledAt);

    if (scheduledAtDate <= recruitUntilDate) {
      throw new BadRequestException(
        '미션 수행일은 모집 마감일 이후여야 합니다.',
      );
    }

    // 트랜잭션으로 모임 및 관련 데이터 생성
    const createdMeetingId = await this.dataSource.transaction(
      async (manager) => {
        // 포인트 계산
        const requiredPoints = mission.basePoints; // 1배수
        const rewardPoints = mission.basePoints; // 1배수

        // 모임 생성
        const meeting = manager.create(Meeting, {
          missionId,
          hostUserId,
          recruitUntil: recruitUntilDate,
          scheduledAt: scheduledAtDate,
          maxParticipants: participants || mission.participants,
          status: MeetingStatus.RECRUITING,
          requiredPoints,
          rewardPoints,
          minimumParticipants: 2, // 호스트 포함 최소 2명
        });

        const savedMeeting = await manager.save(meeting);

        // 호스트를 참여자로 자동 등록
        const hostParticipant = manager.create(MeetingParticipant, {
          meetingId: savedMeeting.id,
          userId: hostUserId,
          status: ParticipantStatus.JOINED,
          isHost: true,
          joinedAt: now,
        });

        await manager.save(hostParticipant);

        // 모임 정보 업데이트 (introduction, focusScore)
        if (introduction !== undefined || focusScore !== undefined) {
          savedMeeting.introduction = introduction || null;
          savedMeeting.focusScore = focusScore || 50;
          await manager.save(savedMeeting);
        }

        // 모임 프로필 생성 (선택적, traits가 있을 때만)
        if (traits?.length) {
          const meetingProfile = manager.create(MeetingProfile, {
            meetingId: savedMeeting.id,
            introduction: introduction || '',
            focusScore: focusScore || 50,
            hostStake: mission.hostStakePoints || 0,
            participantStake: mission.participantStakePoints || 0,
          });

          await manager.save(meetingProfile);

          // 특성 정보 저장
          if (traits && traits.length > 0) {
            for (const trait of traits) {
              await manager
                .createQueryBuilder()
                .insert()
                .into(MeetingProfileTrait)
                .values({
                  meetingId: savedMeeting.id,
                  hashtagId: parseInt(trait.id, 10),
                  preference: TraitPreference.PREFERRED,
                  weight: 70,
                })
                .execute();
            }
          }
        }

        // 생성된 모임의 ID 반환
        return savedMeeting.id;
      },
    );

    // 트랜잭션 완료 후 상세 정보 조회
    return await this.getMeetingDetail(createdMeetingId, hostUserId);
  }

  async deleteMeeting(meetingId: string, userId: string): Promise<void> {
    // 모임 존재 확인
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
      relations: ['participantList'],
    });

    if (!meeting) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }

    // 호스트 권한 확인
    if (meeting.hostUserId !== userId) {
      throw new BadRequestException('모임을 삭제할 권한이 없습니다.');
    }

    // 모집 중인 모임만 삭제 가능
    if (meeting.status !== MeetingStatus.RECRUITING) {
      throw new BadRequestException('모집 중인 모임만 삭제할 수 있습니다.');
    }

    // 참여자가 호스트만 있는지 확인 (호스트 외 다른 참여자가 있으면 삭제 불가)
    const otherParticipants =
      meeting.participantList?.filter((p) => !p.isHost) || [];
    if (otherParticipants.length > 0) {
      throw new BadRequestException('참여자가 있는 모임은 삭제할 수 없습니다.');
    }

    // 트랜잭션으로 관련 데이터 삭제
    await this.dataSource.transaction(async (manager) => {
      // 참여자 정보 삭제
      await manager.delete(MeetingParticipant, { meetingId });

      // 모임 프로필 및 특성 정보 삭제
      const meetingProfile = await manager.findOne(MeetingProfile, {
        where: { meetingId },
      });

      if (meetingProfile) {
        await manager.delete(MeetingProfileTrait, { meetingId });
        await manager.delete(MeetingProfile, { meetingId });
      }

      // 모임 삭제
      await manager.delete(Meeting, { id: meetingId });
    });
  }

  private applyDateFilters(
    queryBuilder: SelectQueryBuilder<Meeting>,
    query: GetMeetingsQueryDto,
  ): void {
    // date 파라미터를 selectedDate로 매핑
    const selectedDate = query.selectedDate || query.date;

    // 특정 날짜 선택이 우선순위
    if (selectedDate) {
      // YYYY-MM-DD 형식 날짜를 파싱 (타임존 무시)
      const dateParts = selectedDate.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // month는 0-based
        const day = parseInt(dateParts[2], 10);

        // 로컬 시간대로 날짜 생성
        const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
        const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

        queryBuilder.andWhere(
          'meeting.scheduledAt >= :startOfDay AND meeting.scheduledAt <= :endOfDay',
          { startOfDay, endOfDay },
        );
      }
    } else if (query.weekStartDate && query.weekEndDate) {
      // 주간 범위 필터
      // ISO 문자열에서 날짜만 추출하여 처리
      const weekStart = this.parseLocalDate(query.weekStartDate);
      const weekEnd = this.parseLocalDate(query.weekEndDate);

      if (weekStart && weekEnd) {
        // weekEnd는 해당 날짜의 끝까지 포함
        weekEnd.setHours(23, 59, 59, 999);

        queryBuilder.andWhere(
          'meeting.scheduledAt >= :weekStart AND meeting.scheduledAt <= :weekEnd',
          { weekStart, weekEnd },
        );
      }
    }
  }

  private parseLocalDate(dateString: string): Date | null {
    // ISO 문자열 또는 YYYY-MM-DD 형식 처리
    const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1; // month는 0-based
      const day = parseInt(dateMatch[3], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    }
    return null;
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

  async getMeetingDetail(
    meetingId: string,
    userId?: string,
  ): Promise<MeetingDetailDto> {
    // 모임 정보와 관련 데이터 조회
    const meeting = await this.meetingRepository
      .createQueryBuilder('meeting')
      .leftJoinAndSelect('meeting.mission', 'mission')
      .leftJoinAndSelect('mission.category', 'category')
      .leftJoinAndSelect('mission.district', 'district')
      .leftJoinAndSelect('meeting.host', 'host')
      .leftJoinAndSelect('host.profile', 'hostProfile')
      .leftJoinAndSelect('host.rewards', 'hostRewards')
      .where('meeting.id = :meetingId', { meetingId })
      .getOne();

    if (!meeting) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }

    // 실시간 상태 확인 및 업데이트
    const currentStatus = this.schedulerService.calculateMeetingStatus(meeting);
    if (currentStatus !== meeting.status) {
      await this.meetingRepository.update(meetingId, { status: currentStatus });
      meeting.status = currentStatus;
    }

    // 참여자 정보 조회
    const participants = await this.participantRepository
      .createQueryBuilder('participant')
      .leftJoinAndSelect('participant.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.rewards', 'rewards')
      .where('participant.meetingId = :meetingId', { meetingId })
      .orderBy('participant.createdAt', 'ASC')
      .getMany();

    // 현재 참여자 수 계산 (JOINED 상태만)
    const currentParticipants = participants.filter(
      (p) => p.status === ParticipantStatus.JOINED,
    ).length;

    // 사용자의 참여 상태 확인
    const userParticipation = userId
      ? participants.find((p) => p.userId === userId)
      : null;

    // 참여 가능 여부 결정
    const canJoin = this.canUserJoin(
      meeting,
      currentParticipants,
      userParticipation,
      userId,
    );

    // 참여자 DTO 매핑 (JOINED 상태만)
    const participantDtos: MeetingParticipantDto[] = participants
      .filter((participant) => participant.status === ParticipantStatus.JOINED)
      .map((participant) => ({
        userId: participant.userId,
        nickname: participant.user?.profile?.nickname || '알 수 없음',
        profileImageUrl: participant.user?.profile?.profileImageUrl || null,
        points: participant.user?.profile?.points || 0,
        level: 1, // 임시로 1로 설정 (실제로는 포인트 기반으로 계산)
        status: participant.status,
        isHost: participant.isHost,
        mbti: participant.user?.profile?.mbti || undefined,
        bio: participant.user?.profile?.bio || undefined,
        joinedAt: participant.joinedAt.toISOString(),
        createdAt: participant.createdAt.toISOString(),
      }));

    // 사용자가 로그인된 경우 좋아요 상태 확인
    let isLiked = false;
    if (userId) {
      const likeExists = await this.meetingLikeRepository.findOne({
        where: { meetingId, userId },
      });
      isLiked = !!likeExists;
    }

    // 기본 MeetingDto 생성
    const baseMeetingDto = this.mapMeetingToDto(
      meeting,
      currentParticipants,
      participants,
      isLiked,
      userId,
    );

    // MeetingDetailDto로 확장
    return {
      ...baseMeetingDto,
      maxParticipants: meeting.maxParticipants,
      participantList: participantDtos,
      canJoin,
      userParticipationStatus: userParticipation?.status || null,
      isLiked,
    };
  }

  private canUserJoin(
    meeting: Meeting,
    currentParticipants: number,
    userParticipation: MeetingParticipant | null | undefined,
    userId?: string,
  ): boolean {
    // 로그인하지 않은 사용자는 참여 불가
    if (!userId) {
      return false;
    }

    // 이미 참여 중인 사용자는 참여 불가
    if (
      userParticipation &&
      userParticipation.status === ParticipantStatus.JOINED
    ) {
      return false;
    }

    // 모집이 끝난 모임은 참여 불가
    if (meeting.status !== MeetingStatus.RECRUITING) {
      return false;
    }

    // 모집 마감일이 지난 경우 참여 불가
    if (new Date() > meeting.recruitUntil) {
      return false;
    }

    // 참여자 수가 이미 가득 찬 경우 참여 봨8가
    if (currentParticipants >= meeting.maxParticipants) {
      return false;
    }

    return true;
  }

  private mapMeetingToDto(
    meeting: Meeting,
    currentParticipants: number,
    participants?: MeetingParticipant[],
    isLiked?: boolean,
    userId?: string,
  ): MeetingDto {
    // 실시간 상태 계산
    const currentStatus = this.schedulerService.calculateMeetingStatus(meeting);

    // 사용자 참여 여부 확인
    let meJoined = false;
    let isHost = false;

    if (userId) {
      isHost = meeting.hostUserId === userId;
      if (!isHost && participants) {
        meJoined = participants.some(
          (p) => p.userId === userId && p.status === ParticipantStatus.JOINED,
        );
      } else {
        meJoined = isHost;
      }
    }

    // 참여자 DTO 목록 생성 (리스트용으로 최대 4명만)
    const participantDtos: MeetingParticipantDto[] = participants
      ? participants.slice(0, 4).map((participant) => ({
          userId: participant.userId,
          nickname: participant.user?.profile?.nickname || '알 수 없음',
          profileImageUrl: participant.user?.profile?.profileImageUrl || null,
          points: participant.user?.profile?.points || 0,
          level: 1,
          status: participant.status,
          isHost: participant.isHost,
          mbti: participant.user?.profile?.mbti || undefined,
          bio: participant.user?.profile?.bio || undefined,
          joinedAt:
            participant.joinedAt?.toISOString() ||
            participant.createdAt.toISOString(),
          createdAt: participant.createdAt.toISOString(),
        }))
      : [];

    return {
      id: meeting.id,
      missionId: meeting.missionId,
      hostUserId: meeting.hostUserId,
      status: currentStatus,
      recruitUntil: meeting.recruitUntil
        ? meeting.recruitUntil.toISOString()
        : null,
      scheduledAt: meeting.scheduledAt
        ? meeting.scheduledAt.toISOString()
        : null,
      qrCodeToken: meeting.qrCodeToken || undefined,
      qrGeneratedAt: meeting.qrGeneratedAt?.toISOString() || undefined,
      createdAt: meeting.createdAt.toISOString(),
      updatedAt: meeting.updatedAt.toISOString(),
      currentParticipants,
      maxParticipants: meeting.maxParticipants,
      likesCount: meeting.likesCount || 0,
      isLiked,
      meJoined,
      isHost,
      participants: participantDtos,
      mission: meeting.mission
        ? {
            id: meeting.mission.id,
            title: meeting.mission.title,
            description: meeting.mission.description,
            participants: meeting.mission.participants,
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
            location: meeting.mission.location || undefined,
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
            profileImageUrl: meeting.host.profile?.profileImageUrl || null,
            points: meeting.host.profile?.points || 0,
            level: 1, // 임시로 1로 설정, 나중에 레벨 시스템 추가 시 수정
            mbti: meeting.host.profile?.mbti || undefined,
          }
        : undefined,
      participantProfiles: participants
        ? participants.map((participant) => ({
            id: participant.user?.id || '',
            nickname: participant.user?.profile?.nickname || '알 수 없음',
            profileImageUrl: participant.user?.profile?.profileImageUrl || null,
            level: 1, // 임시로 1로 설정
            isHost: participant.isHost || false,
          }))
        : undefined,
    };
  }

  async toggleLike(
    meetingId: string,
    userId: string,
  ): Promise<{ likesCount: number; isLiked: boolean }> {
    // 모임 존재 확인
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }

    // 기존 좋아요 확인
    const existingLike = await this.meetingLikeRepository.findOne({
      where: { meetingId, userId },
    });

    if (existingLike) {
      // 이미 좋아요가 있으면 에러 반환 (중복 방지)
      throw new BadRequestException('이미 좋아요를 누르셨습니다.');
    }

    // 트랜잭션으로 좋아요 추가 및 카운트 업데이트
    await this.dataSource.transaction(async (manager) => {
      // 좋아요 추가
      const newLike = manager.create(MeetingLike, {
        meetingId,
        userId,
      });
      await manager.save(newLike);

      // 좋아요 수 증가
      meeting.likesCount = meeting.likesCount + 1;
      await manager.save(meeting);
    });

    // 좋아요 알림 발송 (비동기)
    setImmediate(async () => {
      try {
        // 좋아요를 누른 사용자 프로필 조회
        const likerProfile = await this.dataSource
          .getRepository('user_profile')
          .findOne({ where: { userId } });

        const likerName = likerProfile?.nickname || '익명 사용자';

        // 호스트에게 알림 발송 (본인이 아닌 경우만)
        if (meeting.hostUserId !== userId) {
          await this.meetingNotificationHelper.notifyMeetingLiked(
            meeting.hostUserId,
            likerName,
            {
              id: meeting.id,
            },
          );
        }
      } catch (error) {
        this.logger.error('Failed to send meeting liked notification:', error);
      }
    });

    return {
      likesCount: meeting.likesCount,
      isLiked: true,
    };
  }

  /**
   * 모임 참여 (포인트 결제 포함)
   */
  async joinMeeting(
    meetingId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    // 모임 정보 조회
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
      relations: ['mission'],
    });

    if (!meeting) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }

    // 참여 가능성 검증
    const currentParticipants = await this.participantRepository.count({
      where: {
        meetingId: meeting.id,
        status: ParticipantStatus.JOINED,
      },
    });

    const userParticipation = await this.participantRepository.findOne({
      where: { userId, meetingId },
    });

    if (
      !this.canUserJoin(meeting, currentParticipants, userParticipation, userId)
    ) {
      throw new BadRequestException('모임에 참여할 수 없습니다.');
    }

    // 이미 참여 중인지 확인
    if (
      userParticipation &&
      userParticipation.status === ParticipantStatus.JOINED
    ) {
      throw new BadRequestException('이미 참여 중인 모임입니다.');
    }

    // 포인트 결제가 필요한지 확인 (호스트는 결제 면제)
    const isHost = meeting.hostUserId === userId;
    const requiredPoints = meeting.requiredPoints || 0;

    return this.dataSource.transaction(async (manager) => {
      // 참여자 정보 생성 또는 업데이트
      let participant: MeetingParticipant;

      if (userParticipation) {
        // 기존 참여자 상태 업데이트
        participant = userParticipation;
        participant.status = ParticipantStatus.JOINED;
        participant.joinedAt = new Date();
      } else {
        // 새 참여자 생성
        participant = manager.create(MeetingParticipant, {
          meetingId,
          userId,
          status: ParticipantStatus.JOINED,
          isHost: false,
          joinedAt: new Date(),
        });
      }

      // 호스트가 아닌 경우 포인트 결제
      if (!isHost && requiredPoints > 0) {
        try {
          const paymentTransaction =
            await this.pointService.chargePointsForMeeting(
              userId,
              meetingId,
              requiredPoints,
            );

          participant.pointsPaid = true;
          participant.paidAmount = requiredPoints;
          participant.paymentTransactionId = paymentTransaction.id;
        } catch (error) {
          throw new BadRequestException(
            error.message || '포인트 결제에 실패했습니다.',
          );
        }
      } else {
        // 호스트는 결제 면제
        participant.pointsPaid = true;
        participant.paidAmount = 0;
      }

      await manager.save(participant);

      // 참여 완료 후 알림 발송 (트랜잭션 외부에서 실행)
      setImmediate(async () => {
        try {
          const newParticipantCount = currentParticipants + 1;

          // 호스트가 아닌 경우에만 호스트에게 알림 발송
          if (!isHost) {
            // 참여자 프로필 조회
            const participantProfile = await this.dataSource
              .getRepository('user_profile')
              .findOne({ where: { userId } });

            const participantName = participantProfile?.nickname || '새 참가자';

            // 호스트에게 참가자 합류 알림
            await this.meetingNotificationHelper.notifyParticipantJoined(
              meeting.hostUserId,
              participantName,
              {
                id: meeting.id,
                currentParticipants: newParticipantCount,
                maxParticipants: meeting.maxParticipants,
              },
            );

            // 모임이 가득 찬 경우 모든 참가자에게 알림
            if (newParticipantCount === meeting.maxParticipants) {
              const allParticipants = await this.participantRepository.find({
                where: { meetingId, status: ParticipantStatus.JOINED },
                select: ['userId'],
              });

              const participantIds = allParticipants.map((p) => p.userId);

              await this.meetingNotificationHelper.notifyMeetingFull(
                participantIds,
                {
                  id: meeting.id,
                  maxParticipants: meeting.maxParticipants,
                },
              );
            }
          }
        } catch (error) {
          this.logger.error('Failed to send participant notification:', error);
        }
      });

      return {
        success: true,
        message: isHost
          ? '모임에 참여했습니다.'
          : `모임에 참여했습니다. ${requiredPoints}P가 차감되었습니다.`,
      };
    });
  }

  /**
   * 모임 탈퇴 (취소 정책 적용)
   */
  async leaveMeeting(
    meetingId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    // 모임 정보 조회
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
      relations: ['mission'],
    });

    if (!meeting) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }

    // 호스트는 탈퇴 불가
    if (meeting.hostUserId === userId) {
      throw new BadRequestException(
        '호스트는 모임을 탈퇴할 수 없습니다. 모임을 취소해주세요.',
      );
    }

    // 참여자 정보 조회
    const participant = await this.participantRepository.findOne({
      where: { userId, meetingId },
    });

    if (!participant || participant.status !== ParticipantStatus.JOINED) {
      throw new BadRequestException('참여하지 않은 모임입니다.');
    }

    const now = new Date();
    const scheduledAt = new Date(meeting.scheduledAt);
    const timeDiff = scheduledAt.getTime() - now.getTime();
    const hoursUntilMeeting = timeDiff / (1000 * 60 * 60);

    return this.dataSource.transaction(async (manager) => {
      // 참여자 상태 변경
      participant.status = ParticipantStatus.DROPPED;
      await manager.save(participant);

      // 환불/패널티 처리
      const paidAmount = participant.paidAmount || 0;
      let refundAmount = 0;
      const penaltyAmount = 0;
      let message = '';

      if (paidAmount > 0) {
        if (hoursUntilMeeting <= 0) {
          // 모임 시작 후: 노쇼 처리 (환불 없음 + 노쇼 패널티)
          message = `모임 시작 후 나가기로 노쇼 처리됩니다. 환불은 없으며 ${paidAmount}P의 노쇼 패널티가 적용됩니다.`;
          await this.applyAdditionalPenalty(userId, meetingId, paidAmount);
        } else if (hoursUntilMeeting > 6) {
          // 6시간 전: 전액 환불
          refundAmount = paidAmount;
          message = `모임을 탈퇴했습니다. ${refundAmount}P가 환불되었습니다.`;

          await this.pointService.refundPointsForCancellation(
            userId,
            meetingId,
            refundAmount,
            '6시간 전 취소',
          );
        } else {
          // 6시간 이내, 모임 시작 전: 50% 환불
          refundAmount = Math.floor(paidAmount * 0.5);
          message = `모임을 탈퇴했습니다. ${refundAmount}P가 환불되었습니다.`;

          if (refundAmount > 0) {
            await this.pointService.refundPointsForCancellation(
              userId,
              meetingId,
              refundAmount,
              '6시간 이내 모임 시작 전 취소 (50% 환불)',
            );
          }
        }
      } else {
        message = '모임을 탈퇴했습니다.';
      }

      return {
        success: true,
        message,
      };
    });
  }

  /**
   * 호스트가 모임 수정 (RECRUITING 상태에서만 가능)
   */
  async updateMeeting(
    meetingId: string,
    hostUserId: string,
    updateData: { introduction?: string; focusScore?: number },
  ): Promise<{ success: boolean; message: string }> {
    // 모임 정보 조회
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }

    // 호스트 권한 확인
    if (meeting.hostUserId !== hostUserId) {
      throw new BadRequestException('모임을 수정할 권한이 없습니다.');
    }

    // RECRUITING 상태에서만 수정 가능
    if (meeting.status !== MeetingStatus.RECRUITING) {
      throw new BadRequestException('모집 중인 모임만 수정할 수 있습니다.');
    }

    // 수정 가능한 필드만 업데이트
    const updateFields: Partial<Meeting> = {};

    if (updateData.introduction !== undefined) {
      updateFields.introduction = updateData.introduction;
    }

    if (updateData.focusScore !== undefined) {
      // 집중도 점수 범위 검증
      if (updateData.focusScore < 0 || updateData.focusScore > 100) {
        throw new BadRequestException(
          '집중도 점수는 0-100 사이의 값이어야 합니다.',
        );
      }
      updateFields.focusScore = updateData.focusScore;
    }

    if (Object.keys(updateFields).length === 0) {
      throw new BadRequestException('수정할 데이터가 없습니다.');
    }

    // 모임 정보 업데이트
    await this.meetingRepository.update(meetingId, updateFields);

    this.logger.log(`Meeting ${meetingId} updated by host ${hostUserId}`);

    return {
      success: true,
      message: '모임이 수정되었습니다.',
    };
  }

  /**
   * 호스트가 모임 취소 (취소 정책 적용)
   */
  async cancelMeetingByHost(
    meetingId: string,
    hostUserId: string,
    reason: string,
  ): Promise<{ success: boolean; message: string }> {
    // 모임 정보 조회
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
      relations: ['mission'],
    });

    if (!meeting) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }

    // 호스트 권한 확인
    if (meeting.hostUserId !== hostUserId) {
      throw new BadRequestException('모임을 취소할 권한이 없습니다.');
    }

    // 이미 취소된 모임인지 확인
    if (meeting.status === MeetingStatus.CANCELED) {
      throw new BadRequestException('이미 취소된 모임입니다.');
    }

    // 완료된 모임은 취소 불가
    if (meeting.status === MeetingStatus.COMPLETED) {
      throw new BadRequestException('완료된 모임은 취소할 수 없습니다.');
    }

    const now = new Date();
    const recruitUntil = new Date(meeting.recruitUntil);

    // 호스트 취소 가능 조건 확인
    const participants = await this.participantRepository.find({
      where: {
        meetingId,
        status: ParticipantStatus.JOINED,
      },
    });

    const nonHostParticipants = participants.filter((p) => !p.isHost);
    const isRecruitmentEnded = now >= recruitUntil;

    // 새로운 취소 규칙 적용
    if (isRecruitmentEnded) {
      if (nonHostParticipants.length < meeting.minimumParticipants - 1) {
        // 정원 미달 시 취소 가능하나 예치금 환불 없음
      } else {
        // 정원 충족/초과 시 취소 불가
        throw new BadRequestException(
          '모집이 마감되고 정원이 충족된 모임은 취소할 수 없습니다.',
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      // 모임 상태 변경
      await manager.update(
        Meeting,
        { id: meetingId },
        {
          status: MeetingStatus.CANCELED,
          cancelledAt: now,
          cancelledBy: hostUserId,
          cancellationReason: reason,
        },
      );

      // 참여자들 환불 처리
      let totalComfortPoints = 0;

      for (const participant of participants) {
        const isHost = participant.isHost;
        const paidAmount = participant.paidAmount || 0;

        // 참여자 상태 변경
        await manager.update(
          MeetingParticipant,
          { id: participant.id },
          {
            status: ParticipantStatus.DROPPED,
          },
        );

        if (!isHost) {
          if (
            isRecruitmentEnded &&
            nonHostParticipants.length < meeting.minimumParticipants - 1
          ) {
            // 정원 미달로 취소: 예치금 환불 없음, 위로포인트 50P 지급
            await this.pointService.rewardPointsForCompletion(
              participant.userId,
              meetingId,
              50,
            );
            totalComfortPoints += 50;
          } else {
            // 모집 중 취소: 전액 환불 + 위로포인트 50P 지급
            if (paidAmount > 0) {
              await this.pointService.refundPointsForCancellation(
                participant.userId,
                meetingId,
                paidAmount,
                `호스트 취소로 인한 환불: ${reason}`,
              );
            }

            await this.pointService.rewardPointsForCompletion(
              participant.userId,
              meetingId,
              50,
            );
            totalComfortPoints += 50;
          }
        }
      }

      // 호스트에게는 패널티 없음 (새로운 규칙에 따라)

      const message =
        isRecruitmentEnded &&
        nonHostParticipants.length < meeting.minimumParticipants - 1
          ? `모임이 취소되었습니다. 참여자들에게 위로포인트 총 ${totalComfortPoints}P가 지급되었습니다.`
          : `모임이 취소되었습니다. 참여자들에게 환불 및 위로포인트 총 ${totalComfortPoints}P가 지급되었습니다.`;

      return {
        success: true,
        message,
      };
    });
  }

  /**
   * 최소 인원 미달로 자동 취소
   */
  async autoCancelDueToInsufficientParticipants(
    meetingId: string,
  ): Promise<{ success: boolean; message: string }> {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
      relations: ['mission'],
    });

    if (!meeting) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }

    // 현재 참여자 수 확인
    const currentParticipants = await this.participantRepository.count({
      where: {
        meetingId,
        status: ParticipantStatus.JOINED,
      },
    });

    if (currentParticipants >= meeting.minimumParticipants) {
      throw new BadRequestException('최소 인원을 충족하고 있습니다.');
    }

    const now = new Date();
    const participants = await this.participantRepository.find({
      where: {
        meetingId,
        status: ParticipantStatus.JOINED,
      },
    });

    return this.dataSource.transaction(async (manager) => {
      // 모임 상태 변경
      await manager.update(
        Meeting,
        { id: meetingId },
        {
          status: MeetingStatus.CANCELED,
          cancelledAt: now,
          cancellationReason: `최소 인원(${meeting.minimumParticipants}명) 미달로 자동 취소`,
        },
      );

      // 모든 참여자 전액 환불
      let totalRefunded = 0;

      for (const participant of participants) {
        const paidAmount = participant.paidAmount || 0;

        // 참여자 상태 변경
        await manager.update(
          MeetingParticipant,
          { id: participant.id },
          {
            status: ParticipantStatus.DROPPED,
          },
        );

        if (paidAmount > 0) {
          await this.pointService.refundPointsForCancellation(
            participant.userId,
            meetingId,
            paidAmount,
            '최소 인원 미달로 자동 취소',
          );
          totalRefunded += paidAmount;
        }
      }

      return {
        success: true,
        message: `최소 인원 미달로 모임이 자동 취소되었습니다. 총 ${totalRefunded}P가 환불되었습니다.`,
      };
    });
  }

  /**
   * 6시간 전 이후 취소 시 추가 포인트 패널티 적용 (1배수 차감, 최저 0 유지)
   */
  private async applyAdditionalPenalty(
    userId: string,
    meetingId: string,
    penaltyAmount: number,
  ): Promise<void> {
    try {
      await this.pointService.applyNoShowPenalty(
        userId,
        meetingId,
        penaltyAmount,
      );

      this.logger.log(
        `Applied additional penalty of ${penaltyAmount}P to user ${userId} for meeting ${meetingId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to apply additional penalty to user ${userId}:`,
        error,
      );
    }
  }
}
