import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
//import { Chat } from 'src/chat/entities/chat.entity';
import { ChatService } from 'src/chat/chat.service';
//import { error } from 'console';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly Chatservice: ChatService,
  ) {}

  /////////////////////////////////
  async create(createMessageDto: CreateMessageDto) {
    // console.log(createMessageDto, 'dto');
    try {
      const {
        content,
        customer_id,
        agentId,
        Agent_send,
        Customer_send,
        chatId,
      } = createMessageDto;
      //////////////////////
      if (!content && !customer_id) {
        return { msg: 'all filds must be filled' };
      }
      /////////////////////
      // this function will check if the chat is resolced or not if so it will create new chat
      // true or true === treu |||||| true or false === true, |||||false or false === false
      if (!agentId) {
        // if one of them is false perform this action
        const data = await this.Chatservice.check_existance_of_chat(
          content,
          customer_id,
        );
        //////////////****************** */for open session
        if (typeof data === 'object' && 'state' in data) {
         // console.log(data.state, 'the data');
          if (data.state == 1) {
            // create msg hear
            const result = await this.messageRepository.query(
              `INSERT INTO message (content, customerIdId, Agent_send, Customer_send, chatIdId) VALUES (?, ?, ?, ?, ?)`,
              [content, customer_id, Agent_send, Customer_send, data.chatID],
            );
            // Check if the insertion was successful
            if (result.affectedRows === 1) {
              const insertedMessage = await this.messageRepository.query(
                `SELECT * FROM message WHERE id = ?`,
                [result.insertId],
              );

              if (insertedMessage) {
                return insertedMessage;
              } else {
                throw new Error(`Failed to retrieve inserted message`);
              }
            } else {
              throw new Error(`Failed to inserted message`);
            }
          }
          if (data.state == 2) {
            const result = await this.messageRepository.query(
              `INSERT INTO message (content, customerIdId, Agent_send, Customer_send, chatIdId) VALUES (?, ?, ?, ?, ?)`,
              [content, customer_id, Agent_send, Customer_send, data.chatID],
            );
            // Check if the insertion was successful
            if (result.affectedRows === 1) {
              const insertedMessage = await this.messageRepository.query(
                `SELECT * FROM message WHERE id = ?`,
                [result.insertId],
              );

              if (insertedMessage) {
                return insertedMessage;
              } else {
                throw new Error(`Failed to retrieve inserted message`);
              }
            } else {
              throw new Error(`Failed to inserted message`);
            }
          }
        }
        // ////////////////////////////*********************************** */
      }
      ////////////////

      // Execute SQL INSERT statement with parameterized query
      const result = await this.messageRepository.query(
        `INSERT INTO message (content, customerIdId, agentId, Agent_send, Customer_send, chatIdId) VALUES (?, ?, ?, ?, ?, ?)`,
        [content, customer_id, agentId, Agent_send, Customer_send, chatId],
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
    console.log(createMessageDto, 'get me msg')
    try {
      const messages = await this.messageRepository.query(
        `SELECT * FROM message WHERE agentId = ? AND customerIdId = ? AND chatIdId = ?`,
        [
          createMessageDto.agentId,
          createMessageDto.customer_id,
          createMessageDto.chatId,
        ],
      );
      return messages;
    } catch (error) {
      // Handle any errors (e.g., database errors)
      console.error("Failed to retrieve messages:", error);
      throw new Error(`Failed to retrieve messages: ${error.message}`);
    }
  }
   //////////////////////////////////////////
  // async findAll_for_customer(createMessageDto: CreateMessageDto) {
  //   try {
  //     return this.messageRepository.find({
  //       where: { customer_id: createMessageDto.customer_id },
  //     });
  //   } catch (error) {
  //     // Handle any errors (e.g., database errors)
  //     throw new Error(`Failed to retrieve messages: ${error.message}`);
  //   }
  // }
  ///////////////////////////////////////////
  async update_messages_agent(createMessageDto: CreateMessageDto) {
    if(!createMessageDto.agentId && !createMessageDto.chatId){
      return {msg: 'fill all forms'}
    }
    console.log('create dto', createMessageDto);
    try {
      const data = await this.messageRepository.query(
        `
      UPDATE message
      SET agentId = ?
      WHERE chatIdId = ?;
       `,
        [createMessageDto.agentId, createMessageDto.chatId],
      );
      if (data) {
        console.log(data, 'updated message');
        return data;
      } else {
        throw new Error('Something went wrong on updating message');
      }
    } catch (error) {
      console.error('Error updating messages:', error);
      throw new Error(`Failed to update messages: ${error.message}`);
    }
  }
  
}
