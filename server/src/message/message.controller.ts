import { Controller, Get, Post, Body, Patch, } from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post('send')
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.create(createMessageDto);
  }

  @Post('findAll_for_sender')
  findAll_for_sender(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.findAll_for_sender(createMessageDto);
  }

  @Patch('update_messages_agent')
  update_messages_agent(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.update_messages_agent(createMessageDto);
  }

  @Post('get-resolved-messages')
  get_resolved_messages(@Body() createMessageDto: CreateMessageDto){
    return this.messageService.get_resolved_messages(createMessageDto)
  }

  @Patch('make_msg_seen')
  async makeMessagesSeen(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.markMessagesAsSeen(createMessageDto);
    }
}
