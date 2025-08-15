import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  id: string;
  cognitoId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
  memberships: any[];
  organizationId?: string; // Current organization context
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Extract organization ID from headers or query params
    const organizationId =
      request.headers['x-organization-id'] ||
      request.query.organizationId ||
      request.body?.organizationId;

    // Enhance user object with current organization context
    const enhancedUser: CurrentUserData = {
      ...user,
      organizationId,
    };

    return data ? enhancedUser[data] : enhancedUser;
  },
);
