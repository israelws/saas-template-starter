import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Development JWT Auth Guard that bypasses authentication in development mode
 */
@Injectable()
export class DevJwtAuthGuard extends AuthGuard('dev-jwt') {
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
              organizationId: '9eee012e-6860-4c2b-a5e0-431373031703', // TechCorp Global ID
              userId: '11c8f518-4356-42d7-a3ce-8061b2bf3338', // test@example.com
              role: 'admin',
              isDefault: true,
              organization: {
                id: '9eee012e-6860-4c2b-a5e0-431373031703',
                name: 'TechCorp Global',
              },
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
            organizationId: 'e91acfb1-50b7-48a0-9357-2654a252b41e', // Use the actual TechCorp Global ID
            userId: '11c8f518-4356-42d7-a3ce-8061b2bf3338', // test@example.com
            role: 'admin',
            isDefault: true,
            organization: {
              id: 'e91acfb1-50b7-48a0-9357-2654a252b41e',
              name: 'TechCorp Global',
            },
          },
        ],
      };
    }

    return super.handleRequest(err, user, info, context, status);
  }
}