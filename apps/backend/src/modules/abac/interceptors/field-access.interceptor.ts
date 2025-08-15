import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CaslAbilityFactory } from '../factories/casl-ability.factory';
import { Reflector } from '@nestjs/core';

/** Metadata key for field permissions configuration */
export const FIELD_PERMISSIONS_KEY = 'fieldPermissions';

/**
 * Decorator to enable field-level filtering on a controller method
 * When applied, the response will be automatically filtered based on user's field permissions
 *
 * @decorator
 * @param {string} [resourceType] - Optional resource type name (e.g., 'Product', 'Customer')
 * @returns {MethodDecorator} Method decorator
 *
 * @example
 * ```typescript
 * @Get()
 * @UseFieldFiltering('Product')
 * async findAll() {
 *   return this.productService.findAll();
 * }
 * ```
 */
export function UseFieldFiltering(resourceType?: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(FIELD_PERMISSIONS_KEY, resourceType || true, descriptor.value);
    return descriptor;
  };
}

/**
 * Interceptor that automatically filters response data based on user's field-level permissions
 * Works in conjunction with CASL abilities to remove sensitive fields from API responses
 *
 * @class FieldAccessInterceptor
 * @implements {NestInterceptor}
 * @injectable
 *
 * @example
 * ```typescript
 * // In a module
 * providers: [
 *   {
 *     provide: APP_INTERCEPTOR,
 *     useClass: FieldAccessInterceptor,
 *   },
 * ]
 * ```
 */
@Injectable()
export class FieldAccessInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  /**
   * Intercepts the request/response cycle to apply field-level filtering
   *
   * @async
   * @param {ExecutionContext} context - NestJS execution context
   * @param {CallHandler} next - Next handler in the chain
   * @returns {Promise<Observable<any>>} Observable with filtered response data
   */
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if field filtering is enabled for this route
    const fieldPermissionsConfig = this.reflector.get(FIELD_PERMISSIONS_KEY, context.getHandler());

    if (!fieldPermissionsConfig || !user) {
      return next.handle();
    }

    // Get organization context
    const organizationId =
      request.organizationId ||
      request.query.organizationId ||
      request.body?.organizationId ||
      request.headers['x-organization-id'] ||
      user.defaultOrganizationId;

    if (!organizationId) {
      return next.handle();
    }

    // Create ability with field permissions
    const ability = await this.caslAbilityFactory.createForUser(user, organizationId, {
      includeFieldPermissions: true,
    });

    // Store ability in request for use in service layer
    request.caslAbility = ability;

    return next
      .handle()
      .pipe(map((data) => this.filterResponseFields(data, ability, fieldPermissionsConfig)));
  }

  /**
   * Filters response data based on user's field permissions
   * Recursively handles arrays and nested objects
   *
   * @private
   * @param {any} data - The data to filter
   * @param {any} ability - User's CASL ability with field permissions
   * @param {string|boolean} resourceTypeConfig - Resource type or boolean flag
   * @returns {any} Filtered data with only permitted fields
   */
  private filterResponseFields(data: any, ability: any, resourceTypeConfig: string | boolean): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.filterResponseFields(item, ability, resourceTypeConfig));
    }

    // Determine resource type
    const resourceType =
      typeof resourceTypeConfig === 'string' ? resourceTypeConfig : this.getResourceType(data);

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
   * Attempts to determine the resource type from an object
   * Checks constructor name, type fields, and other type indicators
   *
   * @private
   * @param {any} obj - Object to determine type from
   * @returns {string|null} Resource type name or null if not found
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
   * Applies field permissions to filter object properties
   * Removes denied fields and respects readable field lists
   *
   * @private
   * @param {any} obj - Object to filter
   * @param {any} fieldPermissions - Field permissions configuration
   * @returns {any} New object with only permitted fields
   */
  private applyFieldFilter(obj: any, fieldPermissions: any): any {
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
   * Processes individual field values, handling special cases
   * Preserves dates, nulls, and handles nested objects appropriately
   *
   * @private
   * @param {any} value - Field value to process
   * @param {string} fieldName - Name of the field being processed
   * @returns {any} Processed field value
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
 * Service layer helper for applying field-level permissions
 * Provides methods to filter data for both read and write operations
 *
 * @class FieldFilterService
 * @injectable
 *
 * @example
 * ```typescript
 * const filteredData = await fieldFilterService.filterFieldsForWrite(
 *   user,
 *   organizationId,
 *   'Product',
 *   requestData
 * );
 * ```
 */
@Injectable()
export class FieldFilterService {
  constructor(private caslAbilityFactory: CaslAbilityFactory) {}

  /**
   * Filters fields based on user's write permissions before saving
   * Removes fields that the user is not allowed to modify
   *
   * @async
   * @param {any} user - User making the request
   * @param {string} organizationId - Organization context
   * @param {string} resourceType - Type of resource being modified
   * @param {any} data - Data to filter
   * @returns {Promise<any>} Filtered data containing only writable fields
   */
  async filterFieldsForWrite(
    user: any,
    organizationId: string,
    resourceType: string,
    data: any,
  ): Promise<any> {
    const ability = await this.caslAbilityFactory.createForUser(user, organizationId, {
      includeFieldPermissions: true,
    });

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
    const ability = await this.caslAbilityFactory.createForUser(user, organizationId, {
      includeFieldPermissions: true,
    });

    const fieldPermissions = ability.fieldPermissions.get(resourceType);

    if (!fieldPermissions) {
      return fields.map((field) => ({ field, allowed: true }));
    }

    const deniedFields = new Set(fieldPermissions.denied || []);
    const readableFields = fieldPermissions.readable;

    return fields.map((field) => {
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
