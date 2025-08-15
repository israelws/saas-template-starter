import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class OrganizationContextGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract organization ID from various sources
    const organizationId =
      request.params.organizationId ||
      request.headers['x-organization-id'] ||
      request.query.organizationId ||
      request.body?.organizationId;

    if (!organizationId) {
      // No organization context required for this route
      return true;
    }

    // Check if user has access to this organization
    const hasAccess = user.memberships?.some(
      (membership: any) => membership.organizationId === organizationId,
    );

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this organization');
    }

    // Attach organization context to request
    request.organizationId = organizationId;
    request.userMembership = user.memberships.find((m: any) => m.organizationId === organizationId);

    return true;
  }
}
