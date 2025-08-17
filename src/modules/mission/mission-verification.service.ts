import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as winston from 'winston';
import { MissionReview, VerificationStatus } from '../../entities/mission-review.entity';
import { Meeting, MeetingStatus } from '../../entities/meeting.entity';
import { MeetingParticipant, ParticipantStatus } from '../../entities/meeting-participant.entity';
import { VerifyMissionDto, SubmitMissionDto } from './dto/mission-verification.dto';

@Injectable()
export class MissionVerificationService {
  private readonly logger = new winston.Logger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    transports: [new winston.transports.Console()],
  });

  constructor(
    @InjectRepository(MissionReview)
    private readonly missionReviewRepository: Repository<MissionReview>,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(MeetingParticipant)
    private readonly participantRepository: Repository<MeetingParticipant>,
  ) {}

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
      throw new BadRequestException('진행 중인 모임에서만 미션 인증이 가능합니다.');
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
    const verificationResult = await this.processAIVerification(photoUrl, meetingId);

    // 5. 인증 결과 업데이트
    missionReview.aiVerificationStatus = verificationResult.status;
    if (verificationResult.status !== VerificationStatus.PENDING) {
      missionReview.verifiedAt = new Date();
    }

    await this.missionReviewRepository.save(missionReview);

    this.logger.info(`Mission verification completed for user ${userId}, meeting ${meetingId}, status: ${verificationResult.status}`);

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
    const { meetingId, photoUrl, rating, reviewText } = submitMissionDto;

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
    missionReview.photoUrls = [photoUrl];
    missionReview.submittedAt = new Date();

    await this.missionReviewRepository.save(missionReview);

    this.logger.info(`Mission review submitted for user ${userId}, meeting ${meetingId}`);

    return {
      reviewId: missionReview.id,
      submittedAt: missionReview.submittedAt.toISOString(),
    };
  }

  /**
   * AI 인증 처리 (현재는 시뮬레이션, 실제로는 외부 AI API 호출)
   */
  private async processAIVerification(photoUrl: string, meetingId: string): Promise<{
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

      // 임시: 80% 확률로 승인
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // 1-3초 랜덤 딜레이
      const isApproved = Math.random() > 0.2;
      
      return {
        status: isApproved ? VerificationStatus.APPROVED : VerificationStatus.REJECTED,
      };
    } catch (error) {
      this.logger.error('AI verification failed:', error);
      return {
        status: VerificationStatus.REJECTED,
      };
    }
  }
}