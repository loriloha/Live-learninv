import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { LessonsService } from '../lessons/lessons.service';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

type SignalPayload = {
  lessonId: string;
  targetSocketId?: string;
  signal: unknown;
};

type ChatPayload = {
  lessonId: string;
  message: string;
  senderName: string;
};

type JoinPayload = {
  lessonId: string;
  userId: string;
  displayName: string;
};

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN?.split(',') ?? '*',
    credentials: true,
  },
  namespace: 'live',
})
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LiveGateway.name);

  constructor(private readonly lessonsService: LessonsService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected ${client.id}`);
    if (client.data.lessonId) {
      client.to(client.data.lessonId).emit('peer-left', {
        socketId: client.id,
      });
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinPayload,
  ) {
    await this.lessonsService.findById(payload.lessonId);
    client.data.lessonId = payload.lessonId;
    client.data.displayName = payload.displayName;
    client.join(payload.lessonId);
    client.to(payload.lessonId).emit('peer-joined', {
      socketId: client.id,
      displayName: payload.displayName,
    });
    return { socketId: client.id };
  }

  @SubscribeMessage('signal-offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SignalPayload,
  ) {
    this.broadcastSignal('signal-offer', client, payload);
  }

  @SubscribeMessage('signal-answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SignalPayload,
  ) {
    this.broadcastSignal('signal-answer', client, payload);
  }

  @SubscribeMessage('signal-ice')
  handleIce(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SignalPayload,
  ) {
    this.broadcastSignal('signal-ice', client, payload);
  }

  @SubscribeMessage('chat-message')
  handleChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChatPayload,
  ) {
    if (!client.data.lessonId) {
      return;
    }
    this.server.in(client.data.lessonId).emit('chat-message', {
      message: payload.message,
      senderName: payload.senderName ?? client.data.displayName,
      sentAt: new Date().toISOString(),
    });
  }

  private broadcastSignal(
    event: string,
    client: Socket,
    payload: SignalPayload,
  ) {
    if (!payload.lessonId) {
      return;
    }
    const target = payload.targetSocketId
      ? this.server.sockets.sockets.get(payload.targetSocketId)
      : null;

    const body = {
      from: client.id,
      signal: payload.signal,
    };

    if (target) {
      target.emit(event, body);
    } else {
      client.to(payload.lessonId).emit(event, body);
    }
  }
}
