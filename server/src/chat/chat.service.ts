import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat, SessionStatus } from './entities/chat.entity';
import { CreateChatDto } from './dto/create-chat.dto';
// import { WebsocketGateway } from 'src/socket/websocket.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    // private socket : WebsocketGateway
  ) {}

    async create(createChatDto: CreateChatDto) {
      try {
        if (
          !createChatDto.Title ||
          !createChatDto.chat_sender
        ) {
          throw new BadRequestException(' some fields are required');
        }
        //Check if a chat already exists with the same sender and unresolved session
        const existingChat = await this.chatRepository.query(`
            SELECT * FROM chat
            WHERE chatSenderId = ?
            AND session IN (?, ?)
          `, [createChatDto.chat_sender, SessionStatus.OPEN, SessionStatus.IN_SESSION]);

        if (existingChat.length > 0) {
          console.log('existed ', createChatDto.chat_sender),
          console.log("existed", createChatDto.session)

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
  console.log(createChatDto, "tati");
  try {
    if (!createChatDto.chat_receiver) {
      throw new BadRequestException('You have not talked to customers before.');
    }
    console.log('ok here');

    const customers = await this.chatRepository.query(`
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
    `, [createChatDto.chat_receiver]);

    if (customers.length > 0) {
      console.log('Customers available');
      return customers;
    }
  } catch (error) {
    return `Failed to fetch customers with agent id ${createChatDto.chat_receiver}`;
  }
}
    //************GET ALL CUSTOMERS *************/ 
  async getAllCustomers(){
    try{
      const customers = await this.chatRepository.query(`
      SELECT * FROM chat`)
      
     if(customers.length > 0){
      console.log('customers available');
      
      return customers
     }
    }catch(error){
      return `failed to fetch customers`
    }   
  }
  /////////////////////
  async setSessionToInSession(createChatDto: CreateChatDto){
    console.log(createChatDto)
    const chat = await this.chatRepository.findOne({ where: { id : createChatDto.chatId } });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    chat.session = SessionStatus.IN_SESSION;
   chat.chat_receiver = createChatDto.chat_receiver
    return this.chatRepository.save(chat);
  }
  ///////////////////////
  async setSessionToResolved(id: number): Promise<Chat> {
    const chat = await this.chatRepository.findOne({ where: { id } });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    chat.session = SessionStatus.RESOLVED;
    return this.chatRepository.save(chat);
  }
  async updateChat(id : number){
    const chat = await this.chatRepository.findOne({ where: { id } });
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    /// code left
  }


  //insession and customerid    use-effect then store the data in usestate
  async createCustomer(createChatDto: CreateChatDto){
    try{
      const customer = await this.chatRepository.query( `
        SELECT * FROM chat
        WHERE chatSenderId = ?
        AND session = ?
      `, [createChatDto.chat_sender, SessionStatus.IN_SESSION])

      if(customer.length > 0){
        console.log("yaaa");
        return customer
      }
    }catch(e){
      return `faild`
    }
  }
  //message: useeffect from the stored data in the use state and agent id and hard code the customerid
  
}
