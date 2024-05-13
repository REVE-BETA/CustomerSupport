import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Injectable, Scope } from '@nestjs/common';

interface user {
  id: string;
}
//////////////////
interface JwtPayload {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}
interface GroupedMessage extends JwtPayload {
  socketId: string;
}
//////////
interface messaging extends user {
  socketId: string;
}
@Injectable({ scope: Scope.DEFAULT }) // Use Scope.DEFAULT
@WebSocketGateway({ cors: '*' }) //OnGatewayInit
export class WebSocketGateways
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  socketMapGroup = new Map<string, GroupedMessage[]>(); // Changed to an array for multiple sockets per role
  messaging = new Map<string, messaging>();

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket) {
    const token = client.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      client.disconnect(true);
      console.log('Returned');
      return;
    }
    try {
      const payload = this.jwt.verify(token);
     
        this.messaging.set(payload.id, {
          ...payload,
          socketId: client.id,
        });
      
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        console.log('Token expired');
      } else {
        console.error('Error verifying token:', error);
      }
      return;
    }
    console.log(`Client connected: ${client.id}`);
    // this.clients.set(client.id, { id: client.id, socket: client }); // Store the client
    try {
      const payload = this.jwt.verify(token);
       if (!this.socketMapGroup.has(payload.role)) {
        this.socketMapGroup.set(payload.role, []);
      }

      const group = this.socketMapGroup.get(payload.role);
      group.push({
        ...payload,
        socketId: client.id,
      });

      this.socketMapGroup.set(payload.role, group);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        console.log('Token expired');
      } else {
        console.error('Error verifying token:', error);
      }
      return;
    }
  }
  /////////////////////////
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.messaging.delete(client.id); // Remove the client on disconnect
    ////////////
    this.socketMapGroup.forEach((group, key) => {
      const updatedGroup = group.filter(socket => socket.socketId !== client.id);
      this.socketMapGroup.set(key, updatedGroup);
    });
  }
  ///////////////////
  handleSendMessages(data: any) {
   // console.log(data, "full data")
    // Extract necessary data from the 'data' parameter
    const { agentId,  customerIdId, content, chatId, Agent_send, Customer_send } = data[0];
  
    // Emit message to the customer
    const customer = this.messaging.get(customerIdId);
    // console.log(customerIdId, "cid")
    // console.log(this.messaging, "messageing")
    // console.log(customer, 'customer')

    if (customer) {
     // console.log(customer, 'customer')
      this.server.to(customer.socketId).emit('Message', {
        agentId,
        customerIdId,
        content,
        chatId,
        Agent_send,
        Customer_send,
      });
    }
  
    // Emit message to the agent
    const agent = this.messaging.get(agentId);
    //console.log(agent, 'agent')

    if (agent) {
     // console.log(agent, "agent")
      this.server.to(agent.socketId).emit('Message', {
        agentId,
        customerIdId,
        content,
        chatId,
        Agent_send,
        Customer_send,
      });
    }
  }
  //////////////////
  handleOpenSession(data: any){
   // console.log(data[0], 'full data')
   // console.log(this.socketMapGroup, "group")
    const sockets = this.socketMapGroup.get('agent') || [];

    sockets.forEach(socketMeta => {
      this.server.to(socketMeta.socketId).emit('openSession', data[0]);
    });

    if (sockets.length === 0) {
      console.log(`No agent users online at the moment!`);
    }
  }
  /////////////////
  handleINSession(data: any){
    //console.log(data, 'full data')
//console.log(this.socketMapGroup, "group")
    const sockets = this.socketMapGroup.get('agent') || [];

    sockets.forEach(socketMeta => {
      this.server.to(socketMeta.socketId).emit('Insession', data);
    });

    if (sockets.length === 0) {
      console.log(`No agent users online at the moment!`);
    }
  }
   //////////////////
}
