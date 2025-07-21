import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CaslAbilityFactory } from '../factories/casl-ability.factory';
import { Reflector } from '@nestjs/core';

export const FIELD_PERMISSIONS_KEY = 'fieldPermissions';

/**
 * Decorator to enable field-level filtering on a controller method
 */
export function UseFieldFiltering(resourceType?: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(FIELD_PERMISSIONS_KEY, resourceType || true, descriptor.value);
    return descriptor;
  };
}

@Injectable()
export class FieldAccessInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Check if field filtering is enabled for this route
    const fieldPermissionsConfig = this.reflector.get(
      FIELD_PERMISSIONS_KEY,
      context.getHandler(),
    );
    
    if (!fieldPermissionsConfig || !user) {
      return next.handle();
    }

    // Get organization context
    const organizationId = request.organizationId || 
                          request.query.organizationId || 
                          request.body?.organizationId ||
                          request.headers['x-organization-id'] ||
                          user.defaultOrganizationId;

    if (!organizationId) {
      return next.handle();
    }

    // Create ability with field permissions
    const ability = await this.caslAbilityFactory.createForUser(
      user,
      organizationId,
      { includeFieldPermissions: true }
    );

    // Store ability in request for use in service layer
    request.caslAbility = ability;

    return next.handle().pipe(
      map(data => this.filterResponseFields(data, ability, fieldPermissionsConfig)),
    );
  }

  /**
   * Filter response data based on field permissions
   */
  private filterResponseFields(
    data: any,
    ability: any,
    resourceTypeConfig: string | boolean,
  ): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.filterResponseFields(item, ability, resourceTypeConfig));
    }

    // Determine resource type
    const resourceType = typeof resourceTypeConfig === 'string' 
      ? resourceTypeConfig 
      : this.getResourceType(data);

    if (!resourceType) {
      return data;
    }

    // Get field permissions for this resource type
    const fieldPermissions = ability.fieldPermissions.get(resourceType);
    
    if (!fieldPermissions) {
      return data;
    }

    // Apply field filtering
    return this.applyFieldFilter(data, fieldPermissions);
  }

  /**
   * Get resource type from object
   */
  private getResourceType(obj: any): string | null {
    // Try to get type from constructor name
    if (obj.constructor && obj.constructor.name !== 'Object') {
      return obj.constructor.name;
    }

    // Try to get type from a type field
    if (obj._type || obj.type || obj.resourceType) {
      return obj._type || obj.type || obj.resourceType;
    }

    return null;
  }

  /**
   * Apply field permissions to an object
   */
  private applyFieldFilter(
    obj: any,
    fieldPermissions: any,
  ): any {
    const filtered: any = {};
    const deniedFields = new Set(fieldPermissions.denied || []);
    const readableFields = fieldPermissions.readable;

    // If readable fields are specified, only include those
    if (readableFields && readableFields.length > 0) {
      for (const field of readableFields) {
        if (!deniedFields.has(field) && field in obj) {
          filtered[field] = this.processFieldValue(obj[field], field);
        }
      }
      return filtered;
    }

    // Otherwise, include all fields except denied ones
    for (const [key, value] of Object.entries(obj)) {
      if (!deniedFields.has(key)) {
        filtered[key] = this.processFieldValue(value, key);
      }
    }

    return filtered;
  }

  /**
   * Process field value, handling nested objects and special cases
   */
  private processFieldValue(value: any, fieldName: string): any {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return value;
    }

    // Handle dates
    if (value instanceof Date) {
      return value;
    }

    // Handle nested objects (but not arrays)
    if (typeof value === 'object' && !Array.isArray(value)) {
      // For certain fields, we might want to apply nested filtering
      // This can be configured based on your needs
      return value;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value;
    }

    // Return primitive values as-is
    return value;
  }
}

/**
 * Service-layer helper for field filtering
 */
@Injectable()
export class FieldFilterService {
  constructor(private caslAbilityFactory: CaslAbilityFactory) {}

  /**
   * Filter fields based on user's permissions before saving
   */
  async filterFieldsForWrite(
    user: any,
    organizationId: string,
    resourceType: string,
    data: any,
  ): Promise<any> {
    const ability = await this.caslAbilityFactory.createForUser(
      user,
      organizationId,
      { includeFieldPermissions: true }
    );

    const fieldPermissions = ability.fieldPermissions.get(resourceType);
    
    if (!fieldPermissions) {
      return data;
    }

    const writableFields = fieldPermissions.writable;
    const deniedFields = new Set(fieldPermissions.denied || []);

    // If writable fields are specified, only allow those
    if (writableFields && writableFields.length > 0) {
      const filtered: any = {};
      for (const field of writableFields) {
        if (!deniedFields.has(field) && field in data) {
          filtered[field] = data[field];
        }
      }
      return filtered;
    }

    // Otherwise, remove denied fields
    const filtered = { ...data };
    for (const field of deniedFields) {
      delete filtered[field];
    }

    return filtered;
  }

  /**
   * Check if user can read specific fields
   */
  async canReadFields(
    user: any,
    organizationId: string,
    resourceType: string,
    fields: string[],
  ): Promise<{ field: string; allowed: boolean }[]> {
    const ability = await this.caslAbilityFactory.createForUser(
      user,
      organizationId,
      { includeFieldPermissions: true }
    );

    const fieldPermissions = ability.fieldPermissions.get(resourceType);
    
    if (!fieldPermissions) {
      return fields.map(field => ({ field, allowed: true }));
    }

    const deniedFields = new Set(fieldPermissions.denied || []);
    const readableFields = fieldPermissions.readable;

    return fields.map(field => {
      if (deniedFields.has(field)) {
        return { field, allowed: false };
      }

      if (readableFields && readableFields.length > 0) {
        return { field, allowed: readableFields.includes(field) };
      }

      return { field, allowed: true };
    });
  }
}