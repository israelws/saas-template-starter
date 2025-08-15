import { Injectable, Inject, forwardRef } from '@nestjs/common';
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  MongoQuery,
  ForcedSubject,
  ExtractSubjectType,
  InferSubjects,
  AbilityClass,
} from '@casl/ability';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Product } from '../../products/entities/product.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Order } from '../../orders/entities/order.entity';
import { PolicyService } from '../services/policy.service';
import { UsersService } from '../../users/users.service';
import { PolicyEffect } from '../entities/policy.entity';

/**
 * All possible actions that can be performed on resources
 * @typedef {string} Action
 */
export type Action =
  | 'manage'
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'export'
  | 'import';

/**
 * All subject types that can be protected by CASL abilities
 * @typedef {InferSubjects|'all'} Subjects
 */
export type Subjects =
  | InferSubjects<
      typeof User | typeof Organization | typeof Product | typeof Customer | typeof Order
    >
  | 'all';

/**
 * CASL ability type for the application using MongoDB-style conditions
 * @typedef {MongoAbility} AppAbility
 */
export type AppAbility = MongoAbility<[Action, Subjects]>;

/**
 * MongoDB query conditions for CASL rules
 * @typedef {MongoQuery} Conditions
 */
export type Conditions = MongoQuery;

/**
 * Field permission configuration for fine-grained access control
 * @interface FieldPermissions
 */
export interface FieldPermissions {
  /** Array of field names that can be read */
  readable?: string[];
  /** Array of field names that can be written/modified */
  writable?: string[];
  /** Array of field names that are explicitly denied (overrides readable/writable) */
  denied?: string[];
}

/**
 * Extended CASL ability that includes field-level permissions
 * @interface AppAbilityWithFields
 * @extends {AppAbility}
 */
export interface AppAbilityWithFields extends AppAbility {
  /** Map of resource types to their field permissions */
  fieldPermissions: Map<string, FieldPermissions>;
}

/**
 * Factory service for creating CASL abilities based on user policies
 * Integrates with the existing ABAC system to provide both resource-level
 * and field-level access control
 *
 * @class CaslAbilityFactory
 * @injectable
 */
@Injectable()
export class CaslAbilityFactory {
  constructor(
    private policyService: PolicyService,
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
  ) {}

  /**
   * Creates a CASL ability instance for a user within a specific organization context
   *
   * @async
   * @param {User} user - The user for whom to create abilities
   * @param {string} organizationId - The organization context
   * @param {Object} [options] - Optional configuration
   * @param {boolean} [options.includeFieldPermissions=true] - Whether to include field permissions
   * @param {string} [options.resourceType] - Specific resource type to filter permissions
   * @param {string} [options.resourceId] - Specific resource ID to filter permissions
   * @returns {Promise<AppAbilityWithFields>} The user's abilities with field permissions
   *
   * @example
   * ```typescript
   * const ability = await caslAbilityFactory.createForUser(user, 'org-123');
   * if (ability.can('read', 'Product')) {
   *   const fields = ability.fieldPermissions.get('Product');
   *   // Filter product fields based on permissions
   * }
   * ```
   */
  async createForUser(
    user: User,
    organizationId: string,
    options?: {
      includeFieldPermissions?: boolean;
      resourceType?: string;
      resourceId?: string;
    },
  ): Promise<AppAbilityWithFields> {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    // Get user roles in the organization
    const userRoles = await this.getUserRolesInOrganization(user.id, organizationId);

    // Field permissions map
    const fieldPermissions = new Map<string, FieldPermissions>();

    // Super admin has all permissions
    if (user.metadata?.isSuperAdmin === true) {
      can('manage', 'all');
      return Object.assign(build(), { fieldPermissions });
    }

    // Get applicable policies for the user's roles
    const policies = await this.policyService.findApplicablePolicies(
      organizationId,
      userRoles,
      user.id,
    );

    // Process each policy
    for (const policy of policies) {
      if (!policy.isActive) continue;

      const effect = policy.effect;
      const actions = policy.actions || [];
      const resourceTypes = this.extractResourceTypes(policy.resources);

      for (const action of actions) {
        for (const resourceType of resourceTypes) {
          const conditions = this.buildConditions(policy, user, organizationId);

          if (effect === PolicyEffect.ALLOW) {
            can(action as Action, resourceType as any, conditions);
          } else {
            cannot(action as Action, resourceType as any, conditions);
          }

          // Process field permissions if available
          if (policy.fieldPermissions && options?.includeFieldPermissions) {
            this.processFieldPermissions(fieldPermissions, resourceType, policy.fieldPermissions);
          }
        }
      }
    }

    // Apply role-based defaults if no policies found
    if (policies.length === 0) {
      this.applyRoleBasedDefaults(can, cannot, userRoles, organizationId);
    }

    const ability = build();
    return Object.assign(ability, { fieldPermissions });
  }

  /**
   * Retrieves user roles in a specific organization
   * Supports both multi-role system and legacy single-role memberships
   *
   * @private
   * @async
   * @param {string} userId - The user's ID
   * @param {string} organizationId - The organization's ID
   * @returns {Promise<string[]>} Array of role names, defaults to ['user'] if no roles found
   */
  private async getUserRolesInOrganization(
    userId: string,
    organizationId: string,
  ): Promise<string[]> {
    // First, check the new multi-role system
    const multiRoles = await this.userService.getUserRoles(userId, organizationId);
    if (multiRoles.length > 0) {
      return multiRoles.map((role) => role.roleName);
    }

    // Fall back to single role from membership
    const user = await this.userService.findOne(userId);
    const membership = user?.memberships?.find(
      (m) => m.organizationId === organizationId || m.organization?.id === organizationId,
    );

    return membership ? [membership.role] : ['user'];
  }

  /**
   * Extracts resource types from various policy resource configurations
   * Handles multiple formats: array, object with types, object with type
   *
   * @private
   * @param {any} resources - Policy resources configuration
   * @returns {string[]} Array of resource type names
   */
  private extractResourceTypes(resources: any): string[] {
    if (!resources) return [];

    if (Array.isArray(resources)) {
      return resources;
    }

    if (resources.types) {
      return resources.types;
    }

    if (resources.type) {
      return [resources.type];
    }

    return [];
  }

  /**
   * Builds MongoDB-style conditions from policy configuration
   * Evaluates dynamic conditions based on user attributes and organization context
   *
   * @private
   * @param {any} policy - The policy object containing conditions
   * @param {User} user - The user for condition evaluation
   * @param {string} organizationId - The organization context
   * @returns {Conditions} MongoDB query conditions for CASL
   */
  private buildConditions(policy: any, user: User, organizationId: string): Conditions {
    const conditions: any = {};

    // Add organization context
    conditions.organizationId = organizationId;

    // Process resource attributes
    if (policy.resources?.attributes) {
      const attributes = policy.resources.attributes;

      for (const [key, value] of Object.entries(attributes)) {
        // Replace variables with actual values
        if (typeof value === 'string' && value.includes('${')) {
          conditions[key] = this.replaceVariables(value, user, organizationId);
        } else {
          conditions[key] = value;
        }
      }
    }

    // Process custom conditions
    if (policy.conditions) {
      Object.assign(conditions, policy.conditions);
    }

    return conditions;
  }

  /**
   * Replace template variables with actual values
   */
  private replaceVariables(template: string, user: User, organizationId: string): string {
    return template
      .replace('${subject.id}', user.id)
      .replace('${subject.userId}', user.id)
      .replace('${subject.email}', user.email)
      .replace('${subject.organizationId}', organizationId);
  }

  /**
   * Process field permissions from policy
   */
  private processFieldPermissions(
    fieldPermissions: Map<string, FieldPermissions>,
    resourceType: string,
    policyFieldPermissions: any,
  ): void {
    if (!policyFieldPermissions[resourceType]) return;

    const existing = fieldPermissions.get(resourceType) || {
      readable: [],
      writable: [],
      denied: [],
    };

    const policy = policyFieldPermissions[resourceType];

    if (policy.readable) {
      existing.readable = [...new Set([...(existing.readable || []), ...policy.readable])];
    }

    if (policy.writable) {
      existing.writable = [...new Set([...(existing.writable || []), ...policy.writable])];
    }

    if (policy.denied) {
      existing.denied = [...new Set([...(existing.denied || []), ...policy.denied])];
    }

    fieldPermissions.set(resourceType, existing);
  }

  /**
   * Apply default permissions based on roles
   */
  private applyRoleBasedDefaults(
    can: any,
    cannot: any,
    roles: string[],
    organizationId: string,
  ): void {
    // Admin role defaults
    if (roles.includes('admin')) {
      can('manage', 'all', { organizationId });
      cannot('delete', 'Organization', { id: organizationId });
    }

    // Manager role defaults
    else if (roles.includes('manager')) {
      can(['read', 'create', 'update'], 'Product', { organizationId });
      can(['read', 'create', 'update'], 'Customer', { organizationId });
      can(['read', 'create', 'update', 'approve'], 'Order', { organizationId });
      can('read', 'User', { organizationId });
    }

    // User role defaults
    else if (roles.includes('user')) {
      can('read', 'Product', { organizationId });
      can(['read', 'create'], 'Order', { organizationId });
      can('read', 'User', { id: { $eq: '${subject.id}' } });
    }
  }

  /**
   * Check if a user can perform an action on a resource with field filtering
   */
  async canWithFields(
    user: User,
    action: Action,
    resource: any,
    organizationId: string,
  ): Promise<{
    allowed: boolean;
    readableFields?: string[];
    writableFields?: string[];
    deniedFields?: string[];
  }> {
    const ability = await this.createForUser(user, organizationId, {
      includeFieldPermissions: true,
      resourceType: resource.constructor.name,
      resourceId: resource.id,
    });

    const allowed = ability.can(action, resource);

    if (!allowed) {
      return { allowed: false };
    }

    const resourceType = resource.constructor.name;
    const fieldPerms = ability.fieldPermissions.get(resourceType);

    return {
      allowed: true,
      readableFields: fieldPerms?.readable,
      writableFields: fieldPerms?.writable,
      deniedFields: fieldPerms?.denied,
    };
  }
}
