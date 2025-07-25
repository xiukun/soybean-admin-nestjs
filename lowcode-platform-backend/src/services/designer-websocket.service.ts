import { Injectable, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

/**
 * WebSocket消息类型
 */
export type WebSocketMessageType = 
  | 'page_update'
  | 'component_add'
  | 'component_update'
  | 'component_delete'
  | 'api_generate'
  | 'api_update'
  | 'collaboration_join'
  | 'collaboration_leave'
  | 'cursor_move'
  | 'selection_change'
  | 'notification';

/**
 * WebSocket消息
 */
export interface WebSocketMessage {
  /** 消息类型 */
  type: WebSocketMessageType;
  /** 消息数据 */
  data: any;
  /** 发送者ID */
  senderId?: string;
  /** 发送者信息 */
  senderInfo?: {
    id: string;
    name: string;
    avatar?: string;
  };
  /** 时间戳 */
  timestamp: number;
  /** 消息ID */
  messageId: string;
}

/**
 * 房间信息
 */
export interface RoomInfo {
  /** 房间ID */
  roomId: string;
  /** 页面ID */
  pageId: string;
  /** 房间成员 */
  members: Map<string, {
    socketId: string;
    userId: string;
    userInfo: any;
    joinTime: number;
    lastActivity: number;
  }>;
  /** 房间创建时间 */
  createdAt: number;
  /** 最后活动时间 */
  lastActivity: number;
}

/**
 * 设计器WebSocket服务
 */
@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/designer',
})
export class DesignerWebSocketService implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DesignerWebSocketService.name);
  private readonly rooms = new Map<string, RoomInfo>();
  private readonly userSockets = new Map<string, string>(); // userId -> socketId
  private readonly socketUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 客户端连接
   */
  async handleConnection(client: Socket) {
    try {
      this.logger.log(`客户端连接: ${client.id}`);

      // 验证JWT token
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`客户端 ${client.id} 未提供认证token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub || payload.userId;

      if (!userId) {
        this.logger.warn(`客户端 ${client.id} token无效`);
        client.disconnect();
        return;
      }

      // 记录用户连接
      this.userSockets.set(userId, client.id);
      this.socketUsers.set(client.id, userId);

      // 设置客户端用户信息
      client.data.userId = userId;
      client.data.userInfo = payload;

      this.logger.log(`用户 ${userId} 连接成功: ${client.id}`);

      // 发送连接成功消息
      client.emit('connected', {
        message: '连接成功',
        userId,
        socketId: client.id,
      });

    } catch (error) {
      this.logger.error(`客户端连接失败: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * 客户端断开连接
   */
  handleDisconnect(client: Socket) {
    try {
      const userId = this.socketUsers.get(client.id);
      
      if (userId) {
        this.logger.log(`用户 ${userId} 断开连接: ${client.id}`);

        // 从所有房间中移除用户
        this.leaveAllRooms(client.id, userId);

        // 清理连接记录
        this.userSockets.delete(userId);
        this.socketUsers.delete(client.id);
      } else {
        this.logger.log(`客户端断开连接: ${client.id}`);
      }
    } catch (error) {
      this.logger.error(`处理客户端断开连接失败: ${error.message}`);
    }
  }

  /**
   * 加入房间（页面协作）
   */
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string; userInfo?: any }
  ) {
    try {
      const userId = client.data.userId;
      const { pageId, userInfo } = data;

      if (!pageId) {
        client.emit('error', { message: '页面ID不能为空' });
        return;
      }

      const roomId = `page_${pageId}`;

      // 加入Socket.IO房间
      await client.join(roomId);

      // 获取或创建房间信息
      let room = this.rooms.get(roomId);
      if (!room) {
        room = {
          roomId,
          pageId,
          members: new Map(),
          createdAt: Date.now(),
          lastActivity: Date.now(),
        };
        this.rooms.set(roomId, room);
      }

      // 添加成员
      room.members.set(userId, {
        socketId: client.id,
        userId,
        userInfo: userInfo || client.data.userInfo,
        joinTime: Date.now(),
        lastActivity: Date.now(),
      });

      room.lastActivity = Date.now();

      this.logger.log(`用户 ${userId} 加入房间 ${roomId}`);

      // 通知房间内其他成员
      client.to(roomId).emit('member_joined', {
        type: 'collaboration_join',
        data: {
          userId,
          userInfo: userInfo || client.data.userInfo,
          memberCount: room.members.size,
        },
        timestamp: Date.now(),
        messageId: this.generateMessageId(),
      });

      // 向加入者发送房间信息
      client.emit('room_joined', {
        roomId,
        pageId,
        members: Array.from(room.members.values()).map(member => ({
          userId: member.userId,
          userInfo: member.userInfo,
          joinTime: member.joinTime,
        })),
        memberCount: room.members.size,
      });

    } catch (error) {
      this.logger.error(`加入房间失败: ${error.message}`);
      client.emit('error', { message: '加入房间失败' });
    }
  }

  /**
   * 离开房间
   */
  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string }
  ) {
    try {
      const userId = client.data.userId;
      const { pageId } = data;

      if (!pageId) {
        client.emit('error', { message: '页面ID不能为空' });
        return;
      }

      const roomId = `page_${pageId}`;
      await this.leaveRoom(client.id, userId, roomId);

    } catch (error) {
      this.logger.error(`离开房间失败: ${error.message}`);
      client.emit('error', { message: '离开房间失败' });
    }
  }

  /**
   * 页面更新
   */
  @SubscribeMessage('page_update')
  async handlePageUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string; pageConfig: any; changeType: string }
  ) {
    try {
      const userId = client.data.userId;
      const { pageId, pageConfig, changeType } = data;

      const roomId = `page_${pageId}`;
      const room = this.rooms.get(roomId);

      if (!room) {
        client.emit('error', { message: '房间不存在' });
        return;
      }

      // 更新房间活动时间
      room.lastActivity = Date.now();
      const member = room.members.get(userId);
      if (member) {
        member.lastActivity = Date.now();
      }

      // 广播页面更新
      const message: WebSocketMessage = {
        type: 'page_update',
        data: {
          pageId,
          pageConfig,
          changeType,
        },
        senderId: userId,
        senderInfo: client.data.userInfo,
        timestamp: Date.now(),
        messageId: this.generateMessageId(),
      };

      client.to(roomId).emit('page_updated', message);

      this.logger.log(`用户 ${userId} 更新页面 ${pageId}: ${changeType}`);

    } catch (error) {
      this.logger.error(`页面更新失败: ${error.message}`);
      client.emit('error', { message: '页面更新失败' });
    }
  }

  /**
   * 组件操作
   */
  @SubscribeMessage('component_operation')
  async handleComponentOperation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      pageId: string;
      operation: 'add' | 'update' | 'delete';
      componentId: string;
      componentConfig?: any;
      position?: { x: number; y: number };
    }
  ) {
    try {
      const userId = client.data.userId;
      const { pageId, operation, componentId, componentConfig, position } = data;

      const roomId = `page_${pageId}`;
      const room = this.rooms.get(roomId);

      if (!room) {
        client.emit('error', { message: '房间不存在' });
        return;
      }

      // 更新活动时间
      room.lastActivity = Date.now();
      const member = room.members.get(userId);
      if (member) {
        member.lastActivity = Date.now();
      }

      // 广播组件操作
      const message: WebSocketMessage = {
        type: `component_${operation}` as WebSocketMessageType,
        data: {
          pageId,
          componentId,
          componentConfig,
          position,
        },
        senderId: userId,
        senderInfo: client.data.userInfo,
        timestamp: Date.now(),
        messageId: this.generateMessageId(),
      };

      client.to(roomId).emit('component_operation', message);

      this.logger.log(`用户 ${userId} 在页面 ${pageId} 执行组件操作: ${operation} ${componentId}`);

    } catch (error) {
      this.logger.error(`组件操作失败: ${error.message}`);
      client.emit('error', { message: '组件操作失败' });
    }
  }

  /**
   * 光标移动
   */
  @SubscribeMessage('cursor_move')
  async handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string; position: { x: number; y: number } }
  ) {
    try {
      const userId = client.data.userId;
      const { pageId, position } = data;

      const roomId = `page_${pageId}`;
      const room = this.rooms.get(roomId);

      if (!room) {
        return; // 静默忽略，光标移动不需要错误提示
      }

      // 更新活动时间
      const member = room.members.get(userId);
      if (member) {
        member.lastActivity = Date.now();
      }

      // 广播光标位置（不包括发送者）
      client.to(roomId).emit('cursor_moved', {
        type: 'cursor_move',
        data: {
          userId,
          userInfo: client.data.userInfo,
          position,
        },
        timestamp: Date.now(),
        messageId: this.generateMessageId(),
      });

    } catch (error) {
      // 光标移动错误不记录日志，避免日志过多
    }
  }

  /**
   * 选择变化
   */
  @SubscribeMessage('selection_change')
  async handleSelectionChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string; selectedComponents: string[] }
  ) {
    try {
      const userId = client.data.userId;
      const { pageId, selectedComponents } = data;

      const roomId = `page_${pageId}`;
      const room = this.rooms.get(roomId);

      if (!room) {
        return;
      }

      // 更新活动时间
      const member = room.members.get(userId);
      if (member) {
        member.lastActivity = Date.now();
      }

      // 广播选择变化
      client.to(roomId).emit('selection_changed', {
        type: 'selection_change',
        data: {
          userId,
          userInfo: client.data.userInfo,
          selectedComponents,
        },
        timestamp: Date.now(),
        messageId: this.generateMessageId(),
      });

    } catch (error) {
      this.logger.error(`选择变化处理失败: ${error.message}`);
    }
  }

  /**
   * API生成通知
   */
  @SubscribeMessage('api_generate')
  async handleApiGenerate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { pageId: string; apiConfig: any; status: 'start' | 'progress' | 'complete' | 'error' }
  ) {
    try {
      const userId = client.data.userId;
      const { pageId, apiConfig, status } = data;

      const roomId = `page_${pageId}`;

      // 广播API生成状态
      const message: WebSocketMessage = {
        type: 'api_generate',
        data: {
          pageId,
          apiConfig,
          status,
        },
        senderId: userId,
        senderInfo: client.data.userInfo,
        timestamp: Date.now(),
        messageId: this.generateMessageId(),
      };

      this.server.to(roomId).emit('api_generation_update', message);

      this.logger.log(`用户 ${userId} API生成状态更新: ${status}`);

    } catch (error) {
      this.logger.error(`API生成通知失败: ${error.message}`);
    }
  }

  /**
   * 发送通知
   */
  async sendNotification(
    userId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      data?: any;
    }
  ) {
    try {
      const socketId = this.userSockets.get(userId);
      
      if (socketId) {
        const message: WebSocketMessage = {
          type: 'notification',
          data: notification,
          timestamp: Date.now(),
          messageId: this.generateMessageId(),
        };

        this.server.to(socketId).emit('notification', message);
        this.logger.log(`发送通知给用户 ${userId}: ${notification.title}`);
      }
    } catch (error) {
      this.logger.error(`发送通知失败: ${error.message}`);
    }
  }

  /**
   * 广播房间消息
   */
  async broadcastToRoom(roomId: string, event: string, message: WebSocketMessage) {
    try {
      this.server.to(roomId).emit(event, message);
      this.logger.log(`广播消息到房间 ${roomId}: ${event}`);
    } catch (error) {
      this.logger.error(`广播房间消息失败: ${error.message}`);
    }
  }

  /**
   * 获取房间信息
   */
  getRoomInfo(roomId: string): RoomInfo | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * 获取用户在线状态
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * 离开房间
   */
  private async leaveRoom(socketId: string, userId: string, roomId: string) {
    const room = this.rooms.get(roomId);
    
    if (room && room.members.has(userId)) {
      // 从房间中移除成员
      room.members.delete(userId);

      // 离开Socket.IO房间
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        await socket.leave(roomId);
      }

      // 通知房间内其他成员
      this.server.to(roomId).emit('member_left', {
        type: 'collaboration_leave',
        data: {
          userId,
          memberCount: room.members.size,
        },
        timestamp: Date.now(),
        messageId: this.generateMessageId(),
      });

      // 如果房间为空，删除房间
      if (room.members.size === 0) {
        this.rooms.delete(roomId);
        this.logger.log(`删除空房间: ${roomId}`);
      }

      this.logger.log(`用户 ${userId} 离开房间 ${roomId}`);
    }
  }

  /**
   * 离开所有房间
   */
  private async leaveAllRooms(socketId: string, userId: string) {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.members.has(userId)) {
        await this.leaveRoom(socketId, userId, roomId);
      }
    }
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清理过期房间
   */
  private cleanupExpiredRooms() {
    const now = Date.now();
    const expireTime = 24 * 60 * 60 * 1000; // 24小时

    for (const [roomId, room] of this.rooms.entries()) {
      if (now - room.lastActivity > expireTime) {
        this.rooms.delete(roomId);
        this.logger.log(`清理过期房间: ${roomId}`);
      }
    }
  }

  /**
   * 定期清理过期房间
   */
  onModuleInit() {
    // 每小时清理一次过期房间
    setInterval(() => {
      this.cleanupExpiredRooms();
    }, 60 * 60 * 1000);
  }
}
