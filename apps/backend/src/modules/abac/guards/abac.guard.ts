import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HierarchicalAbacService } from '../services/hierarchical-abac.service';
import { UsersService } from '../../users/users.service';
import { PolicyEvaluationContext } from '@saas-template/shared';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class AbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private hierarchicalAbacService: HierarchicalAbacService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<{
      resource: string;
      action: string;
    }>(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    // If no permission decorator, allow access (rely on JwtAuthGuard)
    if (!permission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Get user with memberships
    const userWithMemberships = await this.usersService.findOneWithMemberships(user.id);
    
    // Get default organization or use from request
    const organizationId = request.query.organizationId || 
                          request.body?.organizationId ||
                          userWithMemberships.memberships.find(m => m.isDefault)?.organizationId;

    if (!organizationId) {
      throw new ForbiddenException('No organization context available');
    }

    // Find the user's membership for this organization
    const membership = userWithMemberships.memberships.find(
      m => m.organizationId === organizationId,
    );

    if (!membership) {
      throw new ForbiddenException('User is not a member of this organization');
    }

    // Build evaluation context
    const evaluationContext: PolicyEvaluationContext = {
      subject: {
        id: user.id,
        roles: [membership.role],
        groups: [], // Could be populated from a groups service
        attributes: {
          'user.id': user.id,
          'user.email': user.email,
          'user.role': membership.role,
          'user.organizationId': organizationId,
          ...userWithMemberships.attributes,
        },
      },
      resource: {
        type: permission.resource,
        id: request.params.id,
        attributes: {
          'resource.type': permission.resource,
          'resource.id': request.params.id,
          'resource.organizationId': organizationId,
        },
      },
      action: permission.action,
      environment: {
        timestamp: new Date(),
        ipAddress: request.ip,
        attributes: {
          'env.time': new Date().toTimeString().slice(0, 5),
          'env.date': new Date().toISOString().split('T')[0],
          'env.dayOfWeek': new Date().getDay(),
          'env.ipAddress': request.ip,
        },
      },
      organizationId,
    };

    // Evaluate with hierarchy
    const result = await this.hierarchicalAbacService.evaluateWithHierarchy(evaluationContext);

    if (!result.allowed) {
      throw new ForbiddenException(
        `Access denied: ${result.reasons.join(', ')}`,
      );
    }

    // Add evaluation result to request for logging
    request.abacResult = result;

    return true;
  }
}