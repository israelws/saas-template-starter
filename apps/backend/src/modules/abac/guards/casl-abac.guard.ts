import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HierarchicalAbacService } from '../services/hierarchical-abac.service';
import { CaslAbilityFactory, Action, Subjects } from '../factories/casl-ability.factory';
import { PolicyEvaluationContext } from '@saas-template/shared';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

export const CHECK_ABILITY_KEY = 'check_ability';

/**
 * Decorator for CASL-based permissions
 */
export interface AbilityCheck {
  action: Action;
  subject: Subjects | string;
  field?: string;
}

export const CheckAbility = (...checks: AbilityCheck[]) =>
  SetMetadata(CHECK_ABILITY_KEY, checks);

/**
 * Enhanced ABAC Guard that integrates CASL for field-level permissions
 * while maintaining backward compatibility with the existing ABAC system
 */
@Injectable()
export class CaslAbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private hierarchicalAbacService: HierarchicalAbacService,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Super admins bypass all checks
    if (user.metadata?.isSuperAdmin === true || user.isSuperAdmin === true) {
      return true;
    }

    // Get organization context
    const organizationId = this.getOrganizationId(request, user);
    if (!organizationId) {
      throw new ForbiddenException('No organization context available');
    }

    // Store organization ID in request for downstream use
    request.organizationId = organizationId;

    // Check for CASL-based ability checks
    const abilityChecks = this.reflector.getAllAndOverride<AbilityCheck[]>(
      CHECK_ABILITY_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (abilityChecks && abilityChecks.length > 0) {
      return this.checkCaslAbilities(request, user, organizationId, abilityChecks);
    }

    // Fall back to traditional ABAC permission check
    const permission = this.reflector.getAllAndOverride<{
      resource: string;
      action: string;
    }>(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!permission) {
      return true; // No permission required
    }

    return this.checkTraditionalAbac(request, user, organizationId, permission);
  }

  /**
   * Check CASL-based abilities
   */
  private async checkCaslAbilities(
    request: any,
    user: any,
    organizationId: string,
    checks: AbilityCheck[],
  ): Promise<boolean> {
    const ability = await this.caslAbilityFactory.createForUser(
      user,
      organizationId,
      { includeFieldPermissions: true }
    );

    // Store ability in request for use by interceptors
    request.caslAbility = ability;

    // Check all required abilities
    for (const check of checks) {
      let subject: any = check.subject;

      // If subject is a string and matches a param, try to load the entity
      if (typeof subject === 'string' && request.params.id) {
        // This is a simplified example - in production, you'd want to
        // dynamically load the entity based on the resource type
        subject = { 
          id: request.params.id, 
          organizationId,
          _type: check.subject 
        };
      }

      if (!ability.can(check.action, subject)) {
        const fieldInfo = check.field ? ` on field ${check.field}` : '';
        throw new ForbiddenException(
          `You don't have permission to ${check.action} ${check.subject}${fieldInfo}`
        );
      }
    }

    return true;
  }

  /**
   * Check traditional ABAC permissions (backward compatibility)
   */
  private async checkTraditionalAbac(
    request: any,
    user: any,
    organizationId: string,
    permission: { resource: string; action: string },
  ): Promise<boolean> {
    // Get user role
    const userRole = await this.getUserRole(user, organizationId);

    // Build evaluation context
    const evaluationContext = this.buildEvaluationContext(
      request,
      user,
      organizationId,
      userRole,
      permission
    );

    try {
      // Also create CASL ability for field filtering
      const ability = await this.caslAbilityFactory.createForUser(
        user,
        organizationId,
        { includeFieldPermissions: true }
      );
      request.caslAbility = ability;

      // Evaluate with hierarchy
      const result = await this.hierarchicalAbacService.evaluateWithHierarchy(
        evaluationContext
      );

      if (!result.allowed) {
        throw new ForbiddenException(
          `Access denied: ${result.reasons.join(', ')}`
        );
      }

      // Add evaluation result to request for logging
      request.abacResult = result;

      return true;
    } catch (error) {
      // Handle evaluation errors
      console.error('ABAC evaluation error:', error.message);
      
      // For admins, allow access despite evaluation errors
      if (userRole === 'admin' || user.metadata?.isSuperAdmin) {
        return true;
      }
      
      throw new ForbiddenException('Access denied due to policy evaluation error');
    }
  }

  /**
   * Get organization ID from various sources
   */
  private getOrganizationId(request: any, user: any): string | null {
    return request.query.organizationId || 
           request.body?.organizationId ||
           request.headers['x-organization-id'] ||
           request.params.organizationId ||
           user.defaultOrganizationId;
  }

  /**
   * Get user role in organization
   */
  private async getUserRole(user: any, organizationId: string): Promise<string> {
    // Try to get from multi-role system first
    const roles = await this.caslAbilityFactory['getUserRolesInOrganization'](
      user.id,
      organizationId
    );
    
    if (roles.length > 0) {
      // Return highest priority role
      return roles[0];
    }

    // Fall back to membership role
    if (user.memberships && user.memberships.length > 0) {
      const membership = user.memberships.find(
        m => m.organizationId === organizationId || m.organization?.id === organizationId
      );
      if (membership) {
        return membership.role;
      }
    }

    return 'user';
  }

  /**
   * Build evaluation context for traditional ABAC
   */
  private buildEvaluationContext(
    request: any,
    user: any,
    organizationId: string,
    userRole: string,
    permission: { resource: string; action: string },
  ): PolicyEvaluationContext {
    return {
      subject: {
        id: user.id,
        roles: [userRole],
        groups: [],
        attributes: {
          'user.id': user.id,
          'user.email': user.email,
          'user.role': userRole,
          'user.organizationId': organizationId,
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
  }
}