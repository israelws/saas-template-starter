import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AdminOrSuperAdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminOrSuperAdminGuard.name);
  
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    this.logger.debug(`Checking admin permissions for user: ${user?.email}`);
    this.logger.debug(`Request path: ${request.path}`);
    this.logger.debug(`User metadata: ${JSON.stringify(user?.metadata)}`);
    this.logger.debug(`User memberships count: ${user?.memberships?.length || 0}`);

    if (!user) {
      this.logger.debug('No user found in request');
      return false;
    }

    // Check if user is super admin using the metadata field
    if (user.metadata?.isSuperAdmin === true) {
      return true;
    }

    // For non-super admins, always require organization context
    // Get organization ID from various sources
    const organizationId = request.params.organizationId || 
                          request.headers['x-organization-id'] ||
                          request.query.organizationId;
    
    // For organization-specific endpoints, check if user is org admin
    if (organizationId && user.memberships) {
      const membership = user.memberships.find(
        (m: any) => m.organizationId === organizationId || m.organization?.id === organizationId
      );
      
      // Check if user is admin or owner of the organization
      if (membership && (membership.role === 'admin' || membership.role === 'owner')) {
        return true;
      }
    }

    // For system-level email config endpoints without org context,
    // allow org admins if they have at least one admin membership
    if (!organizationId && request.path.includes('/email-config')) {
      const hasAdminRole = user.memberships?.some(
        (m: any) => m.role === 'admin' || m.role === 'owner'
      );
      return hasAdminRole || false;
    }

    return false;
  }
}