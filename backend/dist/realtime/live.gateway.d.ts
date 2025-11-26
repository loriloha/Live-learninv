import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { LessonsService } from '../lessons/lessons.service';
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
export declare class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly lessonsService;
    server: Server;
    private readonly logger;
    constructor(lessonsService: LessonsService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    handleJoinRoom(client: Socket, payload: JoinPayload): Promise<{
        socketId: string;
    }>;
    handleOffer(client: Socket, payload: SignalPayload): void;
    handleAnswer(client: Socket, payload: SignalPayload): void;
    handleIce(client: Socket, payload: SignalPayload): void;
    handleChat(client: Socket, payload: ChatPayload): void;
    private broadcastSignal;
}
export {};
