import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatService, SendMessageDto, ChatMessage } from './chat.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('meetings/:meetingId/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: '채팅 메시지 전송' })
  @ApiResponse({ status: 201, description: '메시지 전송 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '모임을 찾을 수 없음' })
  async sendMessage(
    @Param('meetingId') meetingId: string,
    @Body() dto: Omit<SendMessageDto, 'meetingId'>,
    @Request() req: any,
  ): Promise<{
    status: number;
    message: string;
    result: boolean;
    data: ChatMessage;
  }> {
    const chatMessage = await this.chatService.sendMessage(req.user.id, {
      ...dto,
      meetingId,
    });

    return {
      status: 201,
      message: '메시지가 전송되었습니다.',
      result: true,
      data: chatMessage,
    };
  }

  @Get()
  @ApiOperation({ summary: '채팅 메시지 목록 조회' })
  @ApiResponse({ status: 200, description: '메시지 목록 조회 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async getChatMessages(
    @Param('meetingId') meetingId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @Request() req: any,
  ): Promise<{
    status: number;
    message: string;
    result: boolean;
    data: ChatMessage[];
  }> {
    const messages = await this.chatService.getChatMessages(
      meetingId,
      req.user.id,
      limit,
      offset,
    );

    return {
      status: 200,
      message: '채팅 메시지를 조회했습니다.',
      result: true,
      data: messages,
    };
  }

  @Post('read')
  @ApiOperation({ summary: '채팅 메시지 읽음 처리' })
  @ApiResponse({ status: 200, description: '읽음 처리 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async markAsRead(
    @Param('meetingId') meetingId: string,
    @Body() body: { chatIds: string[] },
    @Request() req: any,
  ): Promise<{ status: number; message: string; result: boolean }> {
    await this.chatService.markMultipleAsRead(
      req.user.id,
      body.chatIds,
      meetingId,
    );

    return {
      status: 200,
      message: '읽음 처리가 완료되었습니다.',
      result: true,
    };
  }
}
