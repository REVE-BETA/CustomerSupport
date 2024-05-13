import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat, SessionStatus } from './entities/chat.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { WebSocketGateways } from 'src/socket/websocket.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    private readonly socket: WebSocketGateways,
    //private socket : WebSocketGateways
  ) {}
  ///////////////////// this metod is called in messages service
  async check_existance_of_chat(content: any, customer_id: any) {
    console.log(content, customer_id);
    try {
      const Checking_If_The_req_Is_Open = await this.chatRepository.query(
        `
    SELECT * FROM chat
    WHERE chatSenderId = ?
    AND session = ?
  `,
        [customer_id, SessionStatus.OPEN],
      );
      ///////
      if (Checking_If_The_req_Is_Open.length > 0) {
        // console.log(Checking_If_The_req_Is_Open);
        return {
          state: 1, // open found
          data: Checking_If_The_req_Is_Open,
          chatID: Checking_If_The_req_Is_Open[0].id,
        };
        // return 1; // 1 for pending response
      }
      const Checking_If_The_req_Is_Insession = await this.chatRepository.query(
        `
    SELECT * FROM chat
    WHERE chatSenderId = ?
    AND session = ?
  `,
        [customer_id, SessionStatus.IN_SESSION],
      );
      ///////

      ///////
      if (
        !Checking_If_The_req_Is_Insession.length &&
        !Checking_If_The_req_Is_Open.length
      ) {
        const newChat = await this.chatRepository
          .createQueryBuilder()
          .insert()
          .into(Chat)
          .values({
            chat_sender: customer_id,
            Title: content,
          })
          .execute();
        console.log(newChat);
        if (newChat.raw.affectedRows === 1) {
          const insertedMessage = await this.chatRepository.query(
            `SELECT * FROM chat WHERE id = ?`,
            [newChat.identifiers[0].id], // Assuming the inserted ID is available in identifiers
          );
          const insertedMessage_for_notif = await this.chatRepository.query(
            `
          SELECT
            chat.id AS chatId,
            chat.Title AS chatTitle,
            chat.session AS chatSession,
            chat.createdAt AS chatCreatedAt,
            chat.chatSenderId AS chatSenderId,
            chat.chatReceiverId AS chatReceiverId,
            JSON_OBJECT(
              'id', customer.id,
              'email', customer.email,
              'phone', customer.phone,
              'service_name', customer.service_name,
              'name', customer.name,
              'isBlocked', customer.isBlocked
            ) AS chatSender
          FROM chat
          INNER JOIN customer ON chat.chatSenderId = customer.id
          WHERE chat.id = ?
        `,
            [newChat.identifiers[0].id],
          );
          if (insertedMessage) {
            this.socket.handleOpenSession(insertedMessage_for_notif);
            console.log(insertedMessage, 'new tat');
            return {
              state: 2, //new or resolved found and create new chat
              data: insertedMessage,
              chatID: insertedMessage[0].id,
            };
          } else {
            throw new Error(`Failed to retrieve inserted message`);
          }
        } else {
          throw new Error(`Failed to insert message`);
        }

        return newChat; // 1 for pending response // also we create new open session
      }
    } catch (error) {
      return { msg: `someting went wrong ${error.message}` };
    }
    // return 0; // no createing of new chat
  }
  /////////////////
  async create(createChatDto: CreateChatDto) {
    try {
      if (!createChatDto.Title || !createChatDto.chat_sender) {
        throw new BadRequestException(' some fields are required');
      }
      //Check if a chat already exists with the same sender and unresolved session
      const existingChat = await this.chatRepository.query(
        `
            SELECT * FROM chat
            WHERE chatSenderId = ?
            AND session IN (?, ?)
          `,
        [
          createChatDto.chat_sender,
          SessionStatus.OPEN,
          SessionStatus.IN_SESSION,
        ],
      );

      if (existingChat.length > 0) {
        console.log('existed ', createChatDto.chat_sender),
          console.log('existed', createChatDto.session);

        return existingChat;
      }

      // const senderNotExist = await this.chatRepository.query(`
      //     SELECT * FROM chat
      //     WHERE chatSender
      // `)
      // If no existing chat found, create a new one
      if (!createChatDto.chat_sender || !createChatDto.Title) {
        throw new BadRequestException('Sender and text are required');
      }
      const newChat = await this.chatRepository
        .createQueryBuilder()
        .insert()
        .into(Chat)
        .values({
          chat_sender: createChatDto.chat_sender,
          Title: createChatDto.Title,
        })
        .execute();
      console.log(newChat);
      return newChat;
    } catch (error) {
      // Handle any errors (e.g., database errors)
      return `Failed to create chat: ${error.message}`;
    }
  }
  ///////////
  async getCustomers(createChatDto: CreateChatDto) {
    console.log(createChatDto, 'tati');
    try {
      if (!createChatDto.chat_receiver) {
        throw new BadRequestException(
          'You have not talked to customers before.',
        );
      }
      console.log('ok here');

      const customers = await this.chatRepository.query(
        `
      SELECT
        chat.id AS chatId,
        chat.Title AS chatTitle,
        chat.session AS chatSession,
        chat.createdAt AS chatCreatedAt,
        chat.chatSenderId AS chatSenderId,
        chat.chatReceiverId AS chatReceiverId,
        JSON_OBJECT(
          'id', customer.id,
          'email', customer.email,
          'phone', customer.phone,
          'service_name', customer.service_name,
          'name', customer.name,
          'isBlocked', customer.isBlocked
        ) AS chatSender
      FROM chat
      INNER JOIN customer ON chat.chatSenderId = customer.id
      WHERE chat.chatReceiverId = ?
      AND chat.session != ?
    `,
        [createChatDto.chat_receiver, SessionStatus.RESOLVED],
      );

      if (customers.length > 0) {
        console.log('Customers available');
        return customers;
      }
    } catch (error) {
      return `Failed to fetch customers with agent id ${createChatDto.chat_receiver}`;
    }
  }
  ///////////
  async get_Resolved_Customers_for_agent(createChatDto: CreateChatDto) {
    console.log(createChatDto, 'tati');
    try {
      if (!createChatDto.chat_receiver) {
        throw new BadRequestException(
          'You have not talked to customers before.',
        );
      }
      console.log('ok here');

      const customers = await this.chatRepository.query(
        `
      SELECT
        chat.id AS chatId,
        chat.Title AS chatTitle,
        chat.session AS chatSession,
        chat.createdAt AS chatCreatedAt,
        chat.chatSenderId AS chatSenderId,
        chat.chatReceiverId AS chatReceiverId,
        JSON_OBJECT(
          'id', customer.id,
          'email', customer.email,
          'phone', customer.phone,
          'service_name', customer.service_name,
          'name', customer.name,
          'isBlocked', customer.isBlocked
        ) AS chatSender
      FROM chat
      INNER JOIN customer ON chat.chatSenderId = customer.id
      WHERE chat.chatReceiverId = ?
     AND chat.session = ?
    `,
        [createChatDto.chat_receiver, SessionStatus.RESOLVED],
      );
      console.log(customers, 'kk');

      if (customers.length > 0) {
        console.log('Customers available', customers);
        return customers;
      }
    } catch (error) {
      return `Failed to fetch customers with agent id ${createChatDto.chat_receiver}`;
    }
  }
  //////////
  // async in_session_customer_for_agent(createChatDto: CreateChatDto) {
  //   console.log(createChatDto, 'tati');
  //   try {
  //     if (!createChatDto.chat_receiver) {
  //       throw new BadRequestException(
  //         'You have not talked to customers before.',
  //       );
  //     }
  //     console.log('ok here');

  //     const customers = await this.chatRepository.query(
  //       `
  //     SELECT
  //       chat.id AS chatId,
  //       chat.Title AS chatTitle,
  //       chat.session AS chatSession,
  //       chat.createdAt AS chatCreatedAt,
  //       chat.chatSenderId AS chatSenderId,
  //       chat.chatReceiverId AS chatReceiverId,
  //       JSON_OBJECT(
  //         'id', customer.id,
  //         'email', customer.email,
  //         'phone', customer.phone,
  //         'service_name', customer.service_name,
  //         'name', customer.name,
  //         'isBlocked', customer.isBlocked
  //       ) AS chatSender
  //     FROM chat
  //     INNER JOIN customer ON chat.chatSenderId = customer.id
  //     WHERE chat.chatReceiverId = ?
  //     AND chat.session = ?
  //   `,
  //       [createChatDto.chat_receiver,SessionStatus.IN_SESSION ],
  //     );

  //     if (customers.length > 0) {
  //       console.log('Customers available');
  //       return customers;
  //     }
  //   } catch (error) {
  //     return `Failed to fetch customers with agent id ${createChatDto.chat_receiver}`;
  //   }
  // }
  //************GET ALL CUSTOMERS *************/
  async getAllCustomers() {
    try {
      const customers = await this.chatRepository.query(
        `
      SELECT
        chat.id AS chatId,
        chat.Title AS chatTitle,
        chat.session AS chatSession,
        chat.createdAt AS chatCreatedAt,
        chat.chatSenderId AS chatSenderId,
        chat.chatReceiverId AS chatReceiverId,
        JSON_OBJECT(
          'id', customer.id,
          'email', customer.email,
          'phone', customer.phone,
          'service_name', customer.service_name,
          'name', customer.name,
          'isBlocked', customer.isBlocked
        ) AS chatSender
      FROM chat
      INNER JOIN customer ON chat.chatSenderId = customer.id
      WHERE chat.session = ?
    `,
        [SessionStatus.OPEN],
      );

      if (customers.length > 0) {
        console.log('customers available');

        return customers;
      }
    } catch (error) {
      return `failed to fetch customers`;
    }
  }
  /////////////////////
  async setSessionToInSession(createChatDto: CreateChatDto) {
    // console.log(createChatDto);
    try {
      const chat = await this.chatRepository.findOne({
        where: { id: createChatDto.chatId },
      });
      if (!chat) {
        throw new NotFoundException('Chat not found');
      }
      chat.session = SessionStatus.IN_SESSION;
      chat.chat_receiver = createChatDto.chat_receiver;
      //this.socket.emitStateToGroup(chat, 'agent')

      const data =await this.chatRepository.save(chat);
      if (!data) {
        throw new Error('something went wrong');
      }
      console.log(data, "insession data")
      this.socket.handleINSession(data)
      return data;
    } catch (error) {
      return error.message;
    }
  }
  //////////////////
  async createCustomer(createChatDto: CreateChatDto) {
    console.log(createChatDto, 'client');
    try {
      const customer = await this.chatRepository.query(
        `
        SELECT * FROM chat
        WHERE chatSenderId = ?
        AND session = ?
      `,
        [createChatDto.chat_sender, SessionStatus.IN_SESSION],
      );

      if (customer.length > 0) {
        console.log('yaaa');
        return customer;
      }
      return [];
    } catch (e) {
      return ` faild`;
    }
  }
  ///////////////////////
  async get_open_chat_for_customer(createChatDto: CreateChatDto) {
    console.log(createChatDto, 'client');
    try {
      const customer = await this.chatRepository.query(
        `
        SELECT * FROM chat
        WHERE chatSenderId = ?
        AND session = ?
      `,
        [createChatDto.chat_sender, SessionStatus.OPEN],
      );
      if (customer.length > 0) {
        console.log('yaaa');
        return customer;
      }
      return [];
    } catch (e) {
      return ` faild`;
    }
  }
  /////////////////////
  async get_Resolved_chat_for_customer(createChatDto: CreateChatDto) {
    try {
      const customer = await this.chatRepository.query(
        `
        SELECT * FROM chat
        WHERE chatSenderId = ?
        AND session = ?
      `,
        [createChatDto.chat_sender, SessionStatus.RESOLVED],
      );
      if (customer.length > 0) {
        // console.log(customer);
        return customer;
      }
      return [];
    } catch (e) {
      return ` faild : ${e.message}`;
    }
  }
  ///////////////////////
  async setSessionToResolved(id: number): Promise<Chat> {
    const chat = await this.chatRepository.findOne({ where: { id } });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    chat.session = SessionStatus.RESOLVED;
    //this.socket.emitStateToGroup(chat, 'agent')
    return this.chatRepository.save(chat);
  }
  async updateChat(id: number) {
    const chat = await this.chatRepository.findOne({ where: { id } });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    /// code left
  }
}
