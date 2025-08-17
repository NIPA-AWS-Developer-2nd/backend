import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MissionReview,
  VerificationStatus,
} from '../../entities/mission-review.entity';
import { Meeting, MeetingStatus } from '../../entities/meeting.entity';
import {
  MeetingParticipant,
  ParticipantStatus,
} from '../../entities/meeting-participant.entity';
import { Mission } from '../../entities/mission.entity';
import {
  VerifyMissionDto,
  SubmitMissionDto,
  UploadVerificationPhotoDto,
} from './dto/mission-verification.dto';
import { BedrockService } from './bedrock.service';

@Injectable()
export class MissionVerificationService {
  private readonly logger = new Logger(MissionVerificationService.name);

  constructor(
    @InjectRepository(MissionReview)
    private readonly missionReviewRepository: Repository<MissionReview>,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(MeetingParticipant)
    private readonly participantRepository: Repository<MeetingParticipant>,
    @InjectRepository(Mission)
    private readonly missionRepository: Repository<Mission>,
    private readonly bedrockService: BedrockService,
  ) {}

  async uploadAndVerifyMissionPhoto(
    userId: string,
    uploadDto: UploadVerificationPhotoDto,
    photoFile: Express.Multer.File,
  ) {
    const meetingId = uploadDto.meetingId;

    // 1. 모임 및 미션 정보 조회
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
      relations: ['mission'],
    });

    if (!meeting) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }

    if (meeting.status !== MeetingStatus.ACTIVE) {
      throw new BadRequestException(
        '진행 중인 모임에서만 미션 인증이 가능합니다.',
      );
    }

    // 2. 참여자 확인
    const participant = await this.participantRepository.findOne({
      where: {
        meetingId,
        userId,
        status: ParticipantStatus.JOINED,
      },
    });

    if (!participant) {
      throw new BadRequestException('해당 모임의 참여자가 아닙니다.');
    }

    // 3. 파일을 base64로 변환
    const photoBase64 = photoFile.buffer.toString('base64');

    try {
      // 4. 미션 정보 확인
      if (!meeting.mission) {
        throw new NotFoundException('모임에 연결된 미션을 찾을 수 없습니다.');
      }

      // 5. Bedrock Claude로 사진 검증
      const verificationResult = await this.bedrockService.verifyMissionPhoto(
        photoBase64,
        meeting.mission.title,
        meeting.mission.description,
        meeting.mission.photoVerificationGuide,
      );

      // 6. 검증 결과에 따른 상태 결정
      const status = verificationResult.isValid
        ? VerificationStatus.APPROVED
        : VerificationStatus.REJECTED;

      // 7. 미션 리뷰 생성 또는 업데이트
      let missionReview = await this.missionReviewRepository.findOne({
        where: { meetingId, userId },
      });

      if (!missionReview) {
        missionReview = this.missionReviewRepository.create({
          meetingId,
          userId,
          reviewText: null,
          rating: null,
          photoUrls: [], // 실제 S3 URL은 나중에 설정
          aiVerificationStatus: status,
          earnedPoints: 0,
          pointCalculationDetails: null,
          submittedAt: new Date(),
          verifiedAt: new Date(), // Since status is always APPROVED or REJECTED here
        });
      } else {
        missionReview.aiVerificationStatus = status;
        missionReview.submittedAt = new Date();
        missionReview.verifiedAt = new Date(); // Since status is always APPROVED or REJECTED here
      }

      await this.missionReviewRepository.save(missionReview);

      this.logger.log(
        `Mission photo verification completed for user ${userId}, meeting ${meetingId}, status: ${status}`,
      );

      return {
        reviewId: missionReview.id,
        status,
        confidence: verificationResult.confidence,
        reasoning: verificationResult.reasoning,
        detectedElements: verificationResult.detectedElements,
        verifiedAt: missionReview.verifiedAt?.toISOString() || null,
      };
    } catch (error) {
      this.logger.error('Photo verification failed:', error);
      throw new BadRequestException(
        `사진 인증 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
    }
  }

  async verifyMission(userId: string, verifyMissionDto: VerifyMissionDto) {
    const { photoUrl, meetingId } = verifyMissionDto;

    // 1. 모임 존재 및 상태 확인
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }

    if (meeting.status !== MeetingStatus.ACTIVE) {
      throw new BadRequestException(
        '진행 중인 모임에서만 미션 인증이 가능합니다.',
      );
    }

    // 2. 참여자 확인
    const participant = await this.participantRepository.findOne({
      where: {
        meetingId,
        userId,
        status: ParticipantStatus.JOINED,
      },
    });

    if (!participant) {
      throw new BadRequestException('해당 모임의 참여자가 아닙니다.');
    }

    // 3. 기존 미션 리뷰 확인 또는 생성
    let missionReview = await this.missionReviewRepository.findOne({
      where: { meetingId, userId },
    });

    if (!missionReview) {
      // 새로운 미션 리뷰 생성
      missionReview = this.missionReviewRepository.create({
        meetingId,
        userId,
        reviewText: null,
        rating: null,
        photoUrls: [photoUrl],
        aiVerificationStatus: VerificationStatus.PENDING,
        earnedPoints: 0,
        pointCalculationDetails: null,
        submittedAt: new Date(),
        verifiedAt: null,
      });
    } else {
      // 기존 리뷰 업데이트
      missionReview.photoUrls = [photoUrl];
      missionReview.aiVerificationStatus = VerificationStatus.PENDING;
      missionReview.submittedAt = new Date();
      missionReview.verifiedAt = null;
    }

    await this.missionReviewRepository.save(missionReview);

    // 4. AI 인증 처리 (현재는 시뮬레이션)
    const verificationResult = await this.processAIVerification(
      photoUrl,
      meetingId,
    );

    // 5. 인증 결과 업데이트
    missionReview.aiVerificationStatus = verificationResult.status;
    if (verificationResult.status !== VerificationStatus.PENDING) {
      missionReview.verifiedAt = new Date();
    }

    await this.missionReviewRepository.save(missionReview);

    this.logger.log(
      `Mission verification completed for user ${userId}, meeting ${meetingId}, status: ${verificationResult.status}`,
    );

    return {
      status: verificationResult.status,
      verifiedAt: missionReview.verifiedAt?.toISOString() || null,
    };
  }

  async getVerificationStatus(userId: string, meetingId: string) {
    const missionReview = await this.missionReviewRepository.findOne({
      where: { meetingId, userId },
    });

    if (!missionReview) {
      throw new NotFoundException('미션 인증 요청을 찾을 수 없습니다.');
    }

    return {
      status: missionReview.aiVerificationStatus,
      verifiedAt: missionReview.verifiedAt?.toISOString() || null,
    };
  }

  async submitMission(userId: string, submitMissionDto: SubmitMissionDto) {
    const meetingId = submitMissionDto.meetingId;
    const photoUrls = submitMissionDto.photoUrls;
    const rating = submitMissionDto.rating;
    const reviewText = submitMissionDto.reviewText;

    // 1. 미션 리뷰 확인
    const missionReview = await this.missionReviewRepository.findOne({
      where: { meetingId, userId },
    });

    if (!missionReview) {
      throw new NotFoundException('미션 인증을 먼저 완료해주세요.');
    }

    if (missionReview.aiVerificationStatus !== VerificationStatus.APPROVED) {
      throw new BadRequestException('승인된 미션 인증이 필요합니다.');
    }

    // 2. 리뷰 정보 업데이트
    missionReview.rating = rating || null;
    missionReview.reviewText = reviewText || null;
    missionReview.photoUrls = photoUrls || [];
    missionReview.submittedAt = new Date();

    await this.missionReviewRepository.save(missionReview);

    this.logger.log(
      `Mission review submitted for user ${userId}, meeting ${meetingId}`,
    );

    return {
      reviewId: missionReview.id,
      submittedAt: missionReview.submittedAt.toISOString(),
    };
  }

  /**
   * AI 인증 처리 (현재는 시뮬레이션, 실제로는 외부 AI API 호출)
   */
  private async processAIVerification(
    _photoUrl: string,
    _meetingId: string,
  ): Promise<{
    status: VerificationStatus;
  }> {
    try {
      // TODO: 실제 AI API 게이트웨이 연동
      // const aiResponse = await fetch('https://ai-gateway.example.com/verify', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${process.env.AI_API_KEY}`,
      //   },
      //   body: JSON.stringify({
      //     imageUrl: photoUrl,
      //     meetingId: meetingId,
      //     verificationCriteria: ['person_present', 'food_visible', 'restaurant_setting'],
      //   }),
      // });
      //
      // const aiResult = await aiResponse.json();
      // return {
      //   status: aiResult.approved ? VerificationStatus.APPROVED : VerificationStatus.REJECTED,
      // };

      // 시연용: timeout 후 항상 승인
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초 고정 딜레이

      return {
        status: VerificationStatus.APPROVED,
      };
    } catch (error) {
      this.logger.error('AI verification failed:', error);
      return {
        status: VerificationStatus.REJECTED,
      };
    }
  }

  /**
   * 모임이 active 상태가 될 때 참여자들의 빈 mission_reviews 생성
   */
  async initializeMissionReviewsForActiveMeeting(
    meetingId: string,
  ): Promise<void> {
    try {
      // 1. 모임 정보 확인
      const meeting = await this.meetingRepository.findOne({
        where: { id: meetingId },
        relations: ['mission'],
      });

      if (!meeting) {
        this.logger.warn(
          `Meeting ${meetingId} not found for mission review initialization`,
        );
        return;
      }

      if (meeting.status !== MeetingStatus.ACTIVE) {
        this.logger.warn(
          `Meeting ${meetingId} is not active, skipping mission review initialization`,
        );
        return;
      }

      // 2. 참여자 목록 조회 (JOINED 상태만)
      const participants = await this.participantRepository.find({
        where: {
          meetingId,
          status: ParticipantStatus.JOINED,
        },
      });

      if (participants.length === 0) {
        this.logger.warn(`No participants found for meeting ${meetingId}`);
        return;
      }

      // 3. 각 참여자에 대해 빈 mission_review 생성
      const existingReviews = await this.missionReviewRepository.find({
        where: { meetingId },
        select: ['userId'],
      });

      const existingUserIds = new Set(
        existingReviews.map((review) => review.userId),
      );
      const newReviews: Partial<MissionReview>[] = [];

      for (const participant of participants) {
        // 이미 리뷰가 있는 사용자는 건너뛰기
        if (existingUserIds.has(participant.userId)) {
          continue;
        }

        newReviews.push({
          meetingId,
          userId: participant.userId,
          reviewText: null,
          rating: null,
          photoUrls: [],
          aiVerificationStatus: VerificationStatus.PENDING,
          earnedPoints: 0,
          pointCalculationDetails: null,
          submittedAt: new Date(),
          verifiedAt: null,
        });
      }

      if (newReviews.length > 0) {
        await this.missionReviewRepository.save(newReviews);
        this.logger.log(
          `Initialized ${newReviews.length} mission reviews for meeting ${meetingId}`,
        );
      } else {
        this.logger.log(
          `All participants already have mission reviews for meeting ${meetingId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize mission reviews for meeting ${meetingId}:`,
        error,
      );
    }
  }
}
