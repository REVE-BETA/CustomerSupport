import { Injectable,  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  /////////////////////////////////
  async create(createMessageDto: CreateMessageDto) {
    try {
      const { content, customer_id, agentId, Agent_send, Customer_send } = createMessageDto;
      
      // Check if any required field is empty
      if (!content || !customer_id || !agentId) {
        throw new Error(`Some field is empty`);
      }
  
      // Execute SQL INSERT statement with parameterized query
      const result = await this.messageRepository.query(
        `INSERT INTO message (content, customerIdId, agentId, Agent_send, Customer_send) VALUES (?, ?, ?, ?, ?)`,
        [content, customer_id, agentId, Agent_send, Customer_send]
      );
      // Check if the insertion was successful
      if (result.affectedRows === 1) {
        const insertedMessage = await this.messageRepository.query(
          `SELECT * FROM message WHERE id = ?`,
          [result.insertId]
        )
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
      return (`Failed to create message: ${error.message}`);
    }
  }
  
  
  ///////////////////////////////////////////
  async findAll_for_sender(createMessageDto: CreateMessageDto) {
    console.log(createMessageDto)
    try {
      return this.messageRepository.query(
        `SELECT * FROM message WHERE agentId = ? AND customerIdId = ?`,
        [createMessageDto.agentId, createMessageDto.customer_id]
      )
    } catch (error) {
      // Handle any errors (e.g., database errors)
     return (`Failed to retrieve messages: ${error.message}`);
    }
  }

  //////////////////////////////////////////
  async findAll_for_customer(createMessageDto: CreateMessageDto) {
    try {
      return this.messageRepository.query(`
        SELECT * FROM message
        WHERE customerIdId = ?
        AND agentId = ?
      `, [createMessageDto.customer_id, createMessageDto.agentId])

    } catch (error) {
      // Handle any errors (e.g., database errors)
      throw new Error(`Failed to retrieve messages: ${error.message}`);
    }
  }
}
