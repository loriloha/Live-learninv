"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LiveGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const lessons_service_1 = require("../lessons/lessons.service");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
let LiveGateway = LiveGateway_1 = class LiveGateway {
    lessonsService;
    server;
    logger = new common_1.Logger(LiveGateway_1.name);
    constructor(lessonsService) {
        this.lessonsService = lessonsService;
    }
    async handleConnection(client) {
        this.logger.log(`Client connected ${client.id}`);
    }
    async handleDisconnect(client) {
        this.logger.log(`Client disconnected ${client.id}`);
        if (client.data.lessonId) {
            client.to(client.data.lessonId).emit('peer-left', {
                socketId: client.id,
            });
        }
    }
    async handleJoinRoom(client, payload) {
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
    handleOffer(client, payload) {
        this.broadcastSignal('signal-offer', client, payload);
    }
    handleAnswer(client, payload) {
        this.broadcastSignal('signal-answer', client, payload);
    }
    handleIce(client, payload) {
        this.broadcastSignal('signal-ice', client, payload);
    }
    handleChat(client, payload) {
        if (!client.data.lessonId) {
            return;
        }
        this.server.in(client.data.lessonId).emit('chat-message', {
            message: payload.message,
            senderName: payload.senderName ?? client.data.displayName,
            sentAt: new Date().toISOString(),
        });
    }
    broadcastSignal(event, client, payload) {
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
        }
        else {
            client.to(payload.lessonId).emit(event, body);
        }
    }
};
exports.LiveGateway = LiveGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], LiveGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], LiveGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('signal-offer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveGateway.prototype, "handleOffer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('signal-answer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveGateway.prototype, "handleAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('signal-ice'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveGateway.prototype, "handleIce", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('chat-message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], LiveGateway.prototype, "handleChat", null);
exports.LiveGateway = LiveGateway = LiveGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_ORIGIN?.split(',') ?? '*',
            credentials: true,
        },
        namespace: 'live',
    }),
    __metadata("design:paramtypes", [lessons_service_1.LessonsService])
], LiveGateway);
//# sourceMappingURL=live.gateway.js.map