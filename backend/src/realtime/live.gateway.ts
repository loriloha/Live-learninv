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
  targetSocketId?: string;
  signal: unknown;
};

type ChatPayload = {
  message: string;
  senderName?: string;
  senderId?: string;
};

type JoinPayload = {
  lessonId: string;
  userId: string;
  displayName: string;
  role?: 'teacher' | 'student';
};

type PeerSummary = {
  socketId: string;
  displayName?: string;
  userId?: string;
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
    const room = this.server.sockets.adapter.rooms.get(payload.lessonId);
    const existingPeers: PeerSummary[] = room
      ? Array.from(room).map((socketId) => {
          const socket = this.server.sockets.sockets.get(socketId);
          return {
            socketId,
            displayName: socket?.data.displayName,
            userId: socket?.data.userId,
          };
        })
      : [];

    client.data.lessonId = payload.lessonId;
    client.data.displayName = payload.displayName;
    client.data.userId = payload.userId;
    client.data.role = payload.role;
    client.join(payload.lessonId);
    client.emit('existing-peers', existingPeers);
    client.to(payload.lessonId).emit('peer-joined', {
      socketId: client.id,
      displayName: payload.displayName,
      userId: payload.userId,
    });
    return { socketId: client.id };
  }

  @SubscribeMessage('signal')
  handleSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SignalPayload,
  ) {
    if (!client.data.lessonId) {
      return;
    }
    const body = {
      from: client.id,
      signal: payload.signal,
    };
    if (payload.targetSocketId) {
      const target = this.server.sockets.sockets.get(payload.targetSocketId);
      target?.emit('signal', body);
      return;
    }
    client.to(client.data.lessonId).emit('signal', body);
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
      senderId:
        payload.senderId ?? client.data.userId ?? client.id,
      sentAt: new Date().toISOString(),
    });
  }

  @SubscribeMessage('end-session')
  async endSession(@ConnectedSocket() client: Socket) {
    if (!client.data.lessonId || !client.data.userId) {
      return;
    }
    const lesson = await this.lessonsService.findById(client.data.lessonId);
    if (lesson.teacher.id !== client.data.userId) {
      this.logger.warn(
        `Non-teacher ${client.id} attempted to end session ${client.data.lessonId}`,
      );
      return;
    }
    this.server.in(client.data.lessonId).emit('session-ended', {
      endedBy: client.data.displayName ?? 'Host',
    });
  }
}
