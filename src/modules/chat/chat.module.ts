import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { 
  MeetingChat, 
  MeetingChatRead, 
  Meeting, 
  MeetingParticipant 
} from '../../entities';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MeetingChat,
      MeetingChatRead,
      Meeting,
      MeetingParticipant,
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}