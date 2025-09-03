import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Development JWT Auth Guard that bypasses authentication in development mode
 */
@Injectable()
export class DevJwtAuthGuard extends AuthGuard(['jwt', 'dev-jwt']) {
  canActivate(context: ExecutionContext) {
    const isDevelopment = 
      process.env.NODE_ENV === 'development' || 
      process.env.NODE_ENV === 'dev' ||
      !process.env.NODE_ENV;

    if (isDevelopment) {
      const request = context.switchToHttp().getRequest();
      
      // If no authorization header, add a dev token
      if (!request.headers.authorization) {
        request.headers.authorization = 'Bearer dev-token';
      }
      
      // Create a mock user if not present
      if (!request.user) {
        request.user = {
          id: '11c8f518-4356-42d7-a3ce-8061b2bf3338', // test@example.com
          cognitoId: 'dev-cognito-id',
          email: 'dev@example.com',
          firstName: 'Dev',
          lastName: 'User',
          status: 'active',
          sub: '11c8f518-4356-42d7-a3ce-8061b2bf3338', // test@example.com
          metadata: {
            isSuperAdmin: true,
          },
          isSuperAdmin: true,
          memberships: [
            {
              id: '22222222-2222-2222-2222-222222222222',
              organizationId: '4c072108-f9d0-4ed8-8cfd-1a65630b0b44', // TechCorp Global
              userId: '11c8f518-4356-42d7-a3ce-8061b2bf3338', // test@example.com
              role: 'admin',
              isDefault: true,
            },
          ],
        };
      }
      
      return true;
    }

    // In production, use normal JWT authentication
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: any, status?: any) {
    const isDevelopment = 
      process.env.NODE_ENV === 'development' || 
      process.env.NODE_ENV === 'dev' ||
      !process.env.NODE_ENV;

    if (isDevelopment && !user) {
      // Return mock user in development
      return {
        id: '11111111-1111-1111-1111-111111111111',
        cognitoId: 'dev-cognito-id',
        email: 'dev@example.com',
        firstName: 'Dev',
        lastName: 'User',
        status: 'active',
        sub: '11111111-1111-1111-1111-111111111111',
        metadata: {
          isSuperAdmin: true,
        },
        isSuperAdmin: true,
        memberships: [
          {
            id: '22222222-2222-2222-2222-222222222222',
            organizationId: '4c072108-f9d0-4ed8-8cfd-1a65630b0b44', // TechCorp Global
            userId: '11111111-1111-1111-1111-111111111111',
            role: 'admin',
            isDefault: true,
          },
        ],
      };
    }

    return super.handleRequest(err, user, info, context, status);
  }
}