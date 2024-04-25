import { Controller, Get, Post, Body, } from '@nestjs/common';
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

  @Get('findAll_for_customer')
  findAll_for_customer(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.findAll_for_customer(createMessageDto);
  }
}
