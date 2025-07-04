import { SetMetadata } from '@nestjs/common';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { AbacGuard } from '../guards/abac.guard';

export const PERMISSION_KEY = 'permission';

export interface Permission {
  resource: string;
  action: string;
}

export const RequirePermission = (resource: string, action: string) => {
  return applyDecorators(
    SetMetadata(PERMISSION_KEY, { resource, action }),
    UseGuards(AbacGuard),
  );
};