import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    // Always allow access for webhook endpoints in development
    // This is a temporary solution for development only
    const request = context.switchToHttp().getRequest();
    const isWebhookEndpoint = request.url?.includes('/webhooks');
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         process.env.NODE_ENV === 'dev' ||
                         !process.env.NODE_ENV ||
                         process.env.NODE_ENV === '';
    
    if (isWebhookEndpoint && isDevelopment) {
      // If no auth header, allow access but user will be undefined
      const authHeader = request.headers?.authorization;
      if (!authHeader) {
        return true;
      }
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: any, status?: any) {
    // For webhook endpoints in development, don't throw error if no user
    const request = context?.switchToHttp?.()?.getRequest?.();
    const isWebhookEndpoint = request?.url?.includes('/webhooks');
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         process.env.NODE_ENV === 'dev' ||
                         !process.env.NODE_ENV ||
                         process.env.NODE_ENV === '';
    
    if (isWebhookEndpoint && isDevelopment) {
      if (err || !user) {
        return null; // Return null user instead of throwing
      }
    }
    
    return super.handleRequest(err, user, info, context, status);
  }
}