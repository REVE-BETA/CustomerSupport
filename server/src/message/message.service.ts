import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { Chat } from 'src/chat/entities/chat.entity';
import { ChatService } from 'src/chat/chat.service';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly Chatservice: ChatService,
  ) {}

  /////////////////////////////////
  async create(createMessageDto: CreateMessageDto) {
    console.log(createMessageDto, 'dto');
    try {
      const { content, customer_id, agentId, Agent_send, Customer_send } =
        createMessageDto;
      // this function will check if the chat is resolced or not if so it will create new chat
      if (!content || !customer_id || !agentId) {
        const data = await this.Chatservice.check_existance_of_chat(
          content,
          customer_id,
        );
        if (data == 1) {
          return { msg: 'your request is in process' }; // which means you already start a session
        }
        if (data == 2) {
          return { msg: 'you have started new session ' };
        }
        // if(data == 0){
        //   return {msg : 'unknown error related to createing chat'}
        // }
      }
      if (!content || !customer_id || !agentId) {
        return { msg: 'all filds must be filled' };
      }
      // Execute SQL INSERT statement with parameterized query
      const result = await this.messageRepository.query(
        `INSERT INTO message (content, customerIdId, agentId, Agent_send, Customer_send) VALUES (?, ?, ?, ?, ?)`,
        [content, customer_id, agentId, Agent_send, Customer_send],
      );
      // Check if the insertion was successful
      if (result.affectedRows === 1) {
        const insertedMessage = await this.messageRepository.query(
          `SELECT * FROM message WHERE id = ?`,
          [result.insertId],
        );
        // Fetch the inserted message from the database using the insertId as the condition
        // const insertedMessage = await this.messageRepository.findOne(result.insertId);
        if (insertedMessage) {
          return insertedMessage;
        } else {
          throw new Error(`Failed to retrieve inserted message`);
        }
      } else {
        throw new Error(`Failed to create message`);
      }
    } catch (error) {
      return `Failed to create message: ${error.message}`;
    }
  }

  ///////////////////////////////////////////
  async findAll_for_sender(createMessageDto: CreateMessageDto) {
    console.log(createMessageDto);
    try {
      return this.messageRepository.query(
        `SELECT * FROM message WHERE agentId = ? AND customerIdId = ?`,
        [createMessageDto.agentId, createMessageDto.customer_id],
      );
    } catch (error) {
      // Handle any errors (e.g., database errors)
      return `Failed to retrieve messages: ${error.message}`;
    }
  }

  //////////////////////////////////////////
  async findAll_for_customer(createMessageDto: CreateMessageDto) {
    try {
      return this.messageRepository.find({
        where: { customer_id: createMessageDto.customer_id },
      });
    } catch (error) {
      // Handle any errors (e.g., database errors)
      throw new Error(`Failed to retrieve messages: ${error.message}`);
    }
  }
}
