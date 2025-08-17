import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ulid } from 'ulid';
import {
  MeetingChat,
  MeetingChatRead,
  Meeting,
  MeetingParticipant,
  ParticipantStatus,
} from '../../entities';

export interface SendMessageDto {
  meetingId: string;
  message: string;
  messageType?: 'text' | 'image' | 'system';
}

export interface ChatMessage {
  id: string;
  meetingId: string;
  userId: string;
  message: string;
  messageType: 'text' | 'image' | 'system';
  createdAt: Date;
  user: {
    id: string;
    nickname: string;
    profileImageUrl: string | null;
  };
  readBy: string[]; // 읽은 사용자 ID 목록
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(MeetingChat)
    private readonly chatRepository: Repository<MeetingChat>,
    @InjectRepository(MeetingChatRead)
    private readonly chatReadRepository: Repository<MeetingChatRead>,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(MeetingParticipant)
    private readonly participantRepository: Repository<MeetingParticipant>,
  ) {}

  async sendMessage(userId: string, dto: SendMessageDto): Promise<ChatMessage> {
    // 모임 존재 확인
    const meeting = await this.meetingRepository.findOne({
      where: { id: dto.meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('모임을 찾을 수 없습니다.');
    }

    // 사용자가 해당 모임의 참가자인지 확인
    const participant = await this.participantRepository.findOne({
      where: {
        meetingId: dto.meetingId,
        userId,
        status: ParticipantStatus.JOINED,
      },
    });

    if (!participant) {
      throw new ForbiddenException('모임 참가자만 채팅을 할 수 있습니다.');
    }

    // 채팅 메시지 저장
    const chat = this.chatRepository.create({
      id: ulid(),
      meetingId: dto.meetingId,
      userId,
      message: dto.message,
      messageType: dto.messageType || 'text',
    });

    const savedChat = await this.chatRepository.save(chat);

    // 발신자는 자동으로 읽음 처리
    await this.markAsRead(userId, savedChat.id, dto.meetingId);

    return this.getChatMessage(savedChat.id);
  }

  async getChatMessages(
    meetingId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ChatMessage[]> {
    // 사용자가 해당 모임의 참가자인지 확인
    const participant = await this.participantRepository.findOne({
      where: {
        meetingId,
        userId,
        status: ParticipantStatus.JOINED,
      },
    });

    if (!participant) {
      throw new ForbiddenException('모임 참가자만 채팅을 볼 수 있습니다.');
    }

    const chats = await this.chatRepository.find({
      where: { meetingId },
      relations: ['user', 'user.profile'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    // 각 메시지의 읽음 상태 조회
    const chatMessages = await Promise.all(
      chats.map(async (chat) => {
        const readBy = await this.getChatReadUsers(chat.id);
        return this.formatChatMessage(chat, readBy);
      }),
    );

    return chatMessages.reverse(); // 시간순으로 정렬
  }

  async markAsRead(
    userId: string,
    chatId: string,
    meetingId: string,
  ): Promise<void> {
    // 이미 읽음 처리되었는지 확인
    const existingRead = await this.chatReadRepository.findOne({
      where: { userId, chatId, meetingId },
    });

    if (existingRead) {
      return; // 이미 읽음 처리됨
    }

    // 읽음 처리
    const chatRead = this.chatReadRepository.create({
      id: ulid(),
      meetingId,
      userId,
      chatId,
    });

    await this.chatReadRepository.save(chatRead);
  }

  async markMultipleAsRead(
    userId: string,
    chatIds: string[],
    meetingId: string,
  ): Promise<void> {
    // 이미 읽음 처리된 채팅 ID들 조회
    const existingReads = await this.chatReadRepository.find({
      where: { userId, meetingId },
    });
    const existingChatIds = new Set(existingReads.map((read) => read.chatId));

    // 아직 읽지 않은 채팅들만 필터링
    const unreadChatIds = chatIds.filter(
      (chatId) => !existingChatIds.has(chatId),
    );

    if (unreadChatIds.length === 0) {
      return;
    }

    // 배치로 읽음 처리
    const chatReads = unreadChatIds.map((chatId) =>
      this.chatReadRepository.create({
        id: ulid(),
        meetingId,
        userId,
        chatId,
      }),
    );

    await this.chatReadRepository.save(chatReads);
  }

  private async getChatMessage(chatId: string): Promise<ChatMessage> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['user', 'user.profile'],
    });

    if (!chat) {
      throw new NotFoundException('채팅 메시지를 찾을 수 없습니다.');
    }

    const readBy = await this.getChatReadUsers(chatId);
    return this.formatChatMessage(chat, readBy);
  }

  private async getChatReadUsers(chatId: string): Promise<string[]> {
    const reads = await this.chatReadRepository.find({
      where: { chatId },
      select: ['userId'],
    });

    return reads.map((read) => read.userId);
  }

  private formatChatMessage(
    chat: MeetingChat & { user: any },
    readBy: string[],
  ): ChatMessage {
    return {
      id: chat.id,
      meetingId: chat.meetingId,
      userId: chat.userId,
      message: chat.message,
      messageType: chat.messageType,
      createdAt: chat.createdAt,
      user: {
        id: chat.user.id,
        nickname: chat.user.profile?.nickname || '익명',
        profileImageUrl: chat.user.profile?.profileImageUrl || null,
      },
      readBy,
    };
  }

  // 모임 정보와 참가자 조회 (채팅 알림용)
  async getMeetingWithParticipants(meetingId: string) {
    return await this.meetingRepository.findOne({
      where: { id: meetingId },
      relations: ['participantList'],
      select: {
        id: true,
      },
    });
  }

  // 사용자 프로필 조회 (채팅 알림용)
  async getUserProfile(userId: string) {
    const result = await this.meetingRepository.query(
      'SELECT nickname FROM user_profiles WHERE "userId" = $1',
      [userId]
    );
    return result[0] || null;
  }
}
