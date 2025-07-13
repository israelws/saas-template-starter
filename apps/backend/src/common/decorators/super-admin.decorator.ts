import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SuperAdminGuard } from '../guards/super-admin.guard';

export const SUPER_ADMIN_KEY = 'superAdmin';

/**
 * Decorator to mark routes that require super admin access
 */
export const SuperAdmin = () =>
  applyDecorators(
    SetMetadata(SUPER_ADMIN_KEY, true),
    UseGuards(JwtAuthGuard, SuperAdminGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiForbiddenResponse({ description: 'Super admin access required' }),
  );