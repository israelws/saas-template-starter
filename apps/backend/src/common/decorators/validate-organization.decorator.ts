import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { OrganizationAccessDeniedException } from '../filters/abac-exception.filter';

export const VALIDATE_ORGANIZATION_KEY = 'validateOrganization';

/**
 * Decorator to validate that the user has access to the specified organization
 * @param options Validation options
 */
export const ValidateOrganization = (options?: {
  paramName?: string; // Name of the parameter containing organization ID (default: 'organizationId')
  allowSuperAdmin?: boolean; // Allow super admins to bypass validation (default: true)
  requireMembership?: boolean; // Require active membership (default: true)
}) => SetMetadata(VALIDATE_ORGANIZATION_KEY, options || {});

/**
 * Decorator to extract and validate organization ID from request
 */
export const OrganizationId = createParamDecorator(
  (paramName: string = 'organizationId', ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Get organization ID from params, query, or body
    const organizationId =
      request.params[paramName] || request.query[paramName] || request.body[paramName];

    if (!organizationId) {
      throw new OrganizationAccessDeniedException(
        'Organization ID is required',
        undefined,
        user?.id,
      );
    }

    // Check if user has access to this organization
    if (user && user.organizations) {
      const hasAccess = user.organizations.some(
        (org: any) => org.organizationId === organizationId,
      );

      if (!hasAccess && !user.isSuperAdmin) {
        throw new OrganizationAccessDeniedException(
          'Access denied to organization',
          organizationId,
          user.id,
        );
      }
    }

    return organizationId;
  },
);

/**
 * Decorator to get user's current organization context
 */
export const CurrentOrganization = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  if (!user || !user.organizationId) {
    throw new OrganizationAccessDeniedException(
      'No organization context available',
      undefined,
      user?.id,
    );
  }

  return {
    id: user.organizationId,
    name: user.organizationName,
    type: user.organizationType,
    role: user.organizationRole,
  };
});

/**
 * Decorator to get all user's organization memberships
 */
export const UserOrganizations = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return user?.organizations || [];
});
