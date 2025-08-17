import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ChatService, SendMessageDto, ChatMessage } from './chat.service';
import { MeetingNotificationHelper } from '../notification/helpers/meeting-notification.helper';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  meetingId?: string;
}

@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV === 'development' ? '*' : process.env.CLIENT_URL,
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, Set<string>>(); // meetingId -> Set<userId>

  constructor(
    private readonly chatService: ChatService,
    private readonly meetingNotificationHelper: MeetingNotificationHelper,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // 실제 구현에서는 JWT 토큰을 통해 사용자 인증을 해야 합니다
      // 여기서는 간단히 query parameter로 처리
      const { userId, meetingId } = client.handshake.query;

      if (!userId || !meetingId) {
        this.logger.warn('Connection rejected: missing userId or meetingId');
        client.disconnect();
        return;
      }

      client.userId = userId as string;
      client.meetingId = meetingId as string;

      // 모임별 연결된 사용자 관리
      if (!this.connectedUsers.has(meetingId as string)) {
        this.connectedUsers.set(meetingId as string, new Set());
      }
      this.connectedUsers.get(meetingId as string)?.add(userId as string);

      // 모임 채팅방에 참여
      client.join(`meeting:${meetingId}`);

      this.logger.log(`User ${userId} connected to meeting ${meetingId}`);

      // 다른 참가자들에게 사용자 입장 알림
      client.to(`meeting:${meetingId}`).emit('user_joined', {
        userId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const { userId, meetingId } = client;

    if (userId && meetingId) {
      // 연결된 사용자 목록에서 제거
      this.connectedUsers.get(meetingId)?.delete(userId);

      // 다른 참가자들에게 사용자 퇴장 알림
      client.to(`meeting:${meetingId}`).emit('user_left', {
        userId,
        timestamp: new Date(),
      });

      this.logger.log(`User ${userId} disconnected from meeting ${meetingId}`);
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { userId, meetingId } = client;

      if (!userId) {
        client.emit('error', { message: '인증되지 않은 사용자입니다.' });
        return;
      }

      // 메시지 저장
      const chatMessage = await this.chatService.sendMessage(userId, {
        meetingId: data.meetingId,
        message: data.message,
        messageType: data.messageType || 'text',
      });

      // 모임 참가자들에게 메시지 브로드캐스트
      this.server
        .to(`meeting:${data.meetingId}`)
        .emit('new_message', chatMessage);

      this.logger.log(
        `📤 Message sent by ${userId} to meeting ${data.meetingId}: "${data.message}"`,
      );

      // 채팅 알림 발송 (비동기)
      setImmediate(async () => {
        try {
          this.logger.log(
            `🔔 Starting chat notification process for meeting ${data.meetingId}`,
          );
          await this.sendChatNotification(data.meetingId, userId, data.message);
        } catch (error) {
          this.logger.error('Failed to send chat notification:', error);
        }
      });
    } catch (error) {
      this.logger.error('Send message error:', error);
      client.emit('error', {
        message: error.message || '메시지 전송에 실패했습니다.',
      });
    }
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() data: { chatIds: string[]; meetingId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { userId } = client;

      if (!userId) {
        client.emit('error', { message: '인증되지 않은 사용자입니다.' });
        return;
      }

      await this.chatService.markMultipleAsRead(
        userId,
        data.chatIds,
        data.meetingId,
      );

      // 모임 참가자들에게 읽음 상태 업데이트 알림
      this.server.to(`meeting:${data.meetingId}`).emit('messages_read', {
        userId,
        chatIds: data.chatIds,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Mark as read error:', error);
      client.emit('error', {
        message: error.message || '읽음 처리에 실패했습니다.',
      });
    }
  }

  @SubscribeMessage('join_meeting')
  async handleJoinMeeting(
    @MessageBody() data: { meetingId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const { userId } = client;

      if (!userId) {
        client.emit('error', { message: '인증되지 않은 사용자입니다.' });
        return;
      }

      // 이전 방에서 나가기
      if (client.meetingId) {
        client.leave(`meeting:${client.meetingId}`);
        this.connectedUsers.get(client.meetingId)?.delete(userId);
      }

      // 새 방에 참여
      client.meetingId = data.meetingId;
      client.join(`meeting:${data.meetingId}`);

      if (!this.connectedUsers.has(data.meetingId)) {
        this.connectedUsers.set(data.meetingId, new Set());
      }
      this.connectedUsers.get(data.meetingId)?.add(userId);

      // 채팅 메시지 로드해서 전송
      const messages = await this.chatService.getChatMessages(
        data.meetingId,
        userId,
      );
      client.emit('chat_history', messages);

      this.logger.log(`User ${userId} joined meeting ${data.meetingId}`);
    } catch (error) {
      this.logger.error('Join meeting error:', error);
      client.emit('error', {
        message: error.message || '모임 채팅방 참여에 실패했습니다.',
      });
    }
  }

  // 연결된 사용자 목록 조회
  getConnectedUsers(meetingId: string): string[] {
    return Array.from(this.connectedUsers.get(meetingId) || []);
  }

  // 채팅 알림 발송 헬퍼
  private async sendChatNotification(
    meetingId: string,
    senderId: string,
    message: string,
  ): Promise<void> {
    try {
      // 모임 정보와 참가자 조회
      const meeting =
        await this.chatService.getMeetingWithParticipants(meetingId);
      if (!meeting) {
        this.logger.warn(
          `Meeting ${meetingId} not found for chat notification`,
        );
        return;
      }

      this.logger.log(
        `🔍 Meeting participants: ${meeting?.participantList?.length || 0}`,
      );
      this.logger.log(
        `🔍 Participant list: ${JSON.stringify(meeting?.participantList?.map((p) => ({ userId: p.userId, nickname: p.user?.profile?.nickname })) || [])}`,
      );

      // 발송자 정보 조회
      const senderInfo = await this.chatService.getUserProfile(senderId);
      const senderName = senderInfo?.nickname || '알 수 없는 사용자';
      this.logger.log(`🔍 Sender: ${senderId} (${senderName})`);

      // 현재 채팅 소켓에 연결된 사용자 제외 (실시간으로 메시지를 받는 사용자들)
      const connectedUserIds = this.getConnectedUsers(meetingId);
      this.logger.log(
        `🔍 Connected users: ${connectedUserIds.length} - ${JSON.stringify(connectedUserIds)}`,
      );

      // 채팅 소켓 오프라인 사용자들에게만 푸시 알림 발송
      const offlineParticipants =
        meeting.participantList
          ?.filter(
            (p) =>
              p.userId !== senderId && !connectedUserIds.includes(p.userId),
          )
          .map((p) => p.userId) || [];

      this.logger.log(
        `🔍 Offline participants: ${offlineParticipants.length} - ${JSON.stringify(offlineParticipants)}`,
      );

      if (offlineParticipants.length > 0) {
        await this.meetingNotificationHelper.notifyNewChatMessage(
          offlineParticipants,
          {
            id: meeting.id,
          },
          senderName,
          message,
        );

        this.logger.log(
          `✅ Chat notification sent to ${offlineParticipants.length} offline users`,
        );
      } else {
        this.logger.log(
          `ℹ️ No offline participants to notify for meeting ${meetingId} (all users are online)`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to send chat notification:', error);
    }
  }
}
