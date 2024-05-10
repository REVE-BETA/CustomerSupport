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

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, chatId: string) {
    console.log(`Client ${client.id} joining room ${chatId}`);
    client.join(chatId); // Join the room specified by c_id
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(client: Socket, payload: { roomId: string; message: any }) {
    const { roomId } = payload;
    console.log(
      `Sending message "${payload.message.content}" to room ${roomId}`,
    );

    // Emit the message to all clients in the specified room
    this.server.to(roomId).emit('message', payload.message);
  }
  ///////////////////
  async emitStateToGroup(state: any, role: string) {
    const sockets = this.socketMapGroup.get(role) || [];

    sockets.forEach(socketMeta => {
      this.server.to(socketMeta.socketId).emit('session', state);
    });

    if (sockets.length === 0) {
      console.log(`No ${role} users online at the moment!`);
    }
  }
  ////////////////////
  @SubscribeMessage('openSession')
  handleOpenSession(client: Socket, payload: {data: any,role: any }) {
    const { data } = payload;
    this.server.emit('openSession',data)

   
  }
}
