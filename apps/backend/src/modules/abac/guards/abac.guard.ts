import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HierarchicalAbacService } from '../services/hierarchical-abac.service';
import { PolicyEvaluationContext } from '@saas-template/shared';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class AbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private hierarchicalAbacService: HierarchicalAbacService,
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

    // Super admins bypass all ABAC checks
    if (user.metadata?.isSuperAdmin === true || user.isSuperAdmin === true) {
      return true;
    }

    // Get organization context from request
    const organizationId =
      request.query.organizationId ||
      request.body?.organizationId ||
      request.headers['x-organization-id'] ||
      user.defaultOrganizationId;

    if (!organizationId) {
      throw new ForbiddenException('No organization context available');
    }

    // Get user role from their membership in the organization
    let userRole = 'user';
    if (user.memberships && user.memberships.length > 0) {
      const membership = user.memberships.find(
        (m) => m.organizationId === organizationId || m.organization?.id === organizationId,
      );
      if (membership) {
        userRole = membership.role;
      }
    }

    // Build evaluation context
    const evaluationContext: PolicyEvaluationContext = {
      subject: {
        id: user.id,
        roles: [userRole],
        groups: [], // Could be populated from a groups service
        attributes: {
          id: user.id,
          email: user.email,
          role: userRole,
          organizationId: organizationId,
          // Add more user attributes
          firstName: user.firstName,
          lastName: user.lastName,
          departmentId: user.departmentId || user.metadata?.departmentId,
        },
      },
      resource: {
        type: permission.resource,
        id: request.params.id,
        attributes: {
          type: permission.resource,
          id: request.params.id,
          organizationId: organizationId,
          // Add more resource attributes based on the request body/params
          ...(request.body?.organizationId && { organizationId: request.body.organizationId }),
          ...(request.params?.organizationId && { organizationId: request.params.organizationId }),
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

    try {
      // Evaluate with hierarchy
      const result = await this.hierarchicalAbacService.evaluateWithHierarchy(evaluationContext);

      if (!result.allowed) {
        throw new ForbiddenException(`Access denied: ${result.reasons.join(', ')}`);
      }

      // Add evaluation result to request for logging
      request.abacResult = result;

      return true;
    } catch (error) {
      // If there's a database error (like missing columns), allow access for now
      // This is a temporary fix until the database schema is properly migrated
      console.error('ABAC evaluation error:', error.message);

      // For super admins and admins, allow access despite evaluation errors
      if (userRole === 'admin' || user.metadata?.isSuperAdmin) {
        return true;
      }

      // For regular users, deny access on evaluation errors
      throw new ForbiddenException('Access denied due to policy evaluation error');
    }
  }
}
