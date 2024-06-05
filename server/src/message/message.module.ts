import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Chat } from '../chat/entities/chat.entity';
import { ChatService } from 'src/chat/chat.service';
import { WebSocketGateways } from 'src/socket/websocket.gateway';

@Module({
  imports:[TypeOrmModule.forFeature([Message, Chat,])],
  controllers: [MessageController],
  providers: [MessageService,ChatService,WebSocketGateways],
})
export class MessageModule {}
