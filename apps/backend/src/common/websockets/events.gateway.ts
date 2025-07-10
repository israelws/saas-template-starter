import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '../logger/logger.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organizationId?: string;
  userOrganizations?: string[];
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new LoggerService('EventsGateway');
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn({ message: "Client connection rejected: No authentication token", clientId: client.id,
          ip: client.handshake.address,});
        client.disconnect();
        return;
      }

      const decoded = this.jwtService.verify(token);
      client.userId = decoded.sub;
      client.organizationId = decoded.organizationId;
      client.userOrganizations = decoded.organizations || [];

      this.connectedClients.set(client.id, client);

      // Join organization-specific rooms
      if (client.organizationId) {
        await client.join(`org:${client.organizationId}`);
      }

      // Join user-specific room
      if (client.userId) {
        await client.join(`user:${client.userId}`);
      }

      // Join rooms for all user organizations
      if (client.userOrganizations) {
        for (const orgId of client.userOrganizations) {
          await client.join(`org:${orgId}`);
        }
      }

      this.logger.log({ message: "Client connected", clientId: client.id,
        userId: client.userId,
        organizationId: client.organizationId,
        userOrganizations: client.userOrganizations,});
    } catch (error) {
      this.logger.error({ message: "Client connection authentication failed", error: error, ...{
        clientId: client.id,
        ip: client.handshake.address,
      } });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    this.logger.log({ message: "Client disconnected", clientId: client.id,
      userId: client.userId,});
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() room: string,
  ) {
    // Only allow joining organization rooms that the user has access to
    if (room.startsWith('org:')) {
      const orgId = room.replace('org:', '');
      if (client.userOrganizations?.includes(orgId)) {
        client.join(room);
        this.logger.debug({ message: "Client joined room", clientId: client.id,
          userId: client.userId,
          room,});
        return { success: true, room };
      } else {
        this.logger.warn({ message: "Client tried to join unauthorized room", clientId: client.id,
          userId: client.userId,
          room,});
        return { success: false, error: 'Unauthorized' };
      }
    }
    
    return { success: false, error: 'Invalid room format' };
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() room: string,
  ) {
    client.leave(room);
    this.logger.debug({ message: "Client left room", clientId: client.id,
      userId: client.userId,
      room,});
    return { success: true, room };
  }

  // Real-time event broadcasting methods

  /**
   * Broadcast organization-related events
   */
  broadcastOrganizationEvent(organizationId: string, event: string, data: any) {
    this.server.to(`org:${organizationId}`).emit(event, {
      type: 'organization',
      organizationId,
      timestamp: new Date().toISOString(),
      data,
    });

    this.logger.debug({ message: "Broadcasted organization event", organizationId,
      event,
      data,});
  }

  /**
   * Broadcast user-specific events
   */
  broadcastUserEvent(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, {
      type: 'user',
      userId,
      timestamp: new Date().toISOString(),
      data,
    });

    this.logger.debug({ message: "Broadcasted user event", userId,
      event,
      data,});
  }

  /**
   * Broadcast policy-related events
   */
  broadcastPolicyEvent(organizationId: string, event: string, data: any) {
    this.server.to(`org:${organizationId}`).emit('policy_update', {
      type: 'policy',
      organizationId,
      event,
      timestamp: new Date().toISOString(),
      data,
    });

    this.logger.debug({ message: "Broadcasted policy event", organizationId,
      event,
      data,});
  }

  /**
   * Broadcast hierarchy changes
   */
  broadcastHierarchyEvent(organizationId: string, event: string, data: any) {
    this.server.to(`org:${organizationId}`).emit('hierarchy_update', {
      type: 'hierarchy',
      organizationId,
      event,
      timestamp: new Date().toISOString(),
      data,
    });

    // Also broadcast to parent organizations if this is a structural change
    if (data.parentId) {
      this.server.to(`org:${data.parentId}`).emit('hierarchy_update', {
        type: 'hierarchy',
        organizationId: data.parentId,
        event: 'child_' + event,
        timestamp: new Date().toISOString(),
        data,
      });
    }

    this.logger.debug({ message: "Broadcasted hierarchy event", organizationId,
      event,
      data,});
  }

  /**
   * Broadcast business object events (products, customers, orders, etc.)
   */
  broadcastBusinessObjectEvent(
    organizationId: string,
    objectType: 'product' | 'customer' | 'order' | 'transaction',
    event: string,
    data: any,
  ) {
    this.server.to(`org:${organizationId}`).emit(`${objectType}_update`, {
      type: objectType,
      organizationId,
      event,
      timestamp: new Date().toISOString(),
      data,
    });

    this.logger.debug({ message: "Broadcasted business object event", organizationId,
      objectType,
      event,
      data,});
  }

  /**
   * Broadcast system-wide notifications
   */
  broadcastSystemNotification(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    this.server.emit('system_notification', {
      type: 'system',
      level,
      message,
      timestamp: new Date().toISOString(),
    });

    this.logger.log({ message: "Broadcasted system notification", level,
      notification: message,});
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get connected clients for an organization
   */
  getOrganizationClientsCount(organizationId: string): number {
    return Array.from(this.connectedClients.values()).filter(
      client => client.userOrganizations?.includes(organizationId)
    ).length;
  }

  /**
   * Check if a user is online
   */
  isUserOnline(userId: string): boolean {
    return Array.from(this.connectedClients.values()).some(
      client => client.userId === userId
    );
  }
}

// Event types for type safety
export interface OrganizationEvent {
  type: 'organization';
  organizationId: string;
  timestamp: string;
  data: any;
}

export interface UserEvent {
  type: 'user';
  userId: string;
  timestamp: string;
  data: any;
}

export interface PolicyEvent {
  type: 'policy';
  organizationId: string;
  event: string;
  timestamp: string;
  data: any;
}

export interface HierarchyEvent {
  type: 'hierarchy';
  organizationId: string;
  event: string;
  timestamp: string;
  data: any;
}

export interface BusinessObjectEvent {
  type: 'product' | 'customer' | 'order' | 'transaction';
  organizationId: string;
  event: string;
  timestamp: string;
  data: any;
}

export interface SystemNotification {
  type: 'system';
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
}