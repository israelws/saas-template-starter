import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { 
  AbilityBuilder, 
  createMongoAbility, 
  MongoAbility,
  MongoQuery,
  ForcedSubject,
  ExtractSubjectType,
  InferSubjects,
  AbilityClass
} from '@casl/ability';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Product } from '../../products/entities/product.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Order } from '../../orders/entities/order.entity';
import { PolicyService } from '../services/policy.service';
import { UsersService } from '../../users/users.service';

// Define all possible actions
export type Action = 
  | 'manage' 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'approve'
  | 'export'
  | 'import';

// Define all subjects
export type Subjects = 
  | InferSubjects<
      | typeof User 
      | typeof Organization 
      | typeof Product 
      | typeof Customer 
      | typeof Order
    >
  | 'all';

// Define ability type
export type AppAbility = MongoAbility<[Action, Subjects]>;

// Define conditions type
export type Conditions = MongoQuery;

// Field permission configuration
export interface FieldPermissions {
  readable?: string[];
  writable?: string[];
  denied?: string[];
}

// Ability with field permissions
export interface AppAbilityWithFields extends AppAbility {
  fieldPermissions: Map<string, FieldPermissions>;
}

@Injectable()
export class CaslAbilityFactory {
  constructor(
    private policyService: PolicyService,
    @Inject(forwardRef(() => UsersService))
    private userService: UsersService,
  ) {}

  /**
   * Create ability for a user in a specific organization context
   */
  async createForUser(
    user: User, 
    organizationId: string, 
    options?: {
      includeFieldPermissions?: boolean;
      resourceType?: string;
      resourceId?: string;
    }
  ): Promise<AppAbilityWithFields> {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility as AbilityClass<AppAbility>
    );
    
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
      user.id
    );
    
    // Process each policy
    for (const policy of policies) {
      if (!policy.is_active) continue;
      
      const effect = policy.effect;
      const actions = policy.actions || [];
      const resourceTypes = this.extractResourceTypes(policy.resources);
      
      for (const action of actions) {
        for (const resourceType of resourceTypes) {
          const conditions = this.buildConditions(policy, user, organizationId);
          
          if (effect === 'Allow') {
            can(action as Action, resourceType, conditions);
          } else {
            cannot(action as Action, resourceType, conditions);
          }
          
          // Process field permissions if available
          if (policy.field_permissions && options?.includeFieldPermissions) {
            this.processFieldPermissions(
              fieldPermissions,
              resourceType,
              policy.field_permissions
            );
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
   * Get user roles in a specific organization
   */
  private async getUserRolesInOrganization(
    userId: string, 
    organizationId: string
  ): Promise<string[]> {
    // First, check the new multi-role system
    const multiRoles = await this.userService.getUserRoles(userId, organizationId);
    if (multiRoles.length > 0) {
      return multiRoles.map(role => role.role_name);
    }
    
    // Fall back to single role from membership
    const user = await this.userService.findOne(userId);
    const membership = user?.memberships?.find(
      m => m.organizationId === organizationId || m.organization?.id === organizationId
    );
    
    return membership ? [membership.role] : ['user'];
  }

  /**
   * Extract resource types from policy resources configuration
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
   * Build conditions from policy configuration
   */
  private buildConditions(
    policy: any, 
    user: User, 
    organizationId: string
  ): Conditions {
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
  private replaceVariables(
    template: string, 
    user: User, 
    organizationId: string
  ): string {
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
    policyFieldPermissions: any
  ): void {
    if (!policyFieldPermissions[resourceType]) return;
    
    const existing = fieldPermissions.get(resourceType) || {
      readable: [],
      writable: [],
      denied: []
    };
    
    const policy = policyFieldPermissions[resourceType];
    
    if (policy.readable) {
      existing.readable = [...new Set([...existing.readable || [], ...policy.readable])];
    }
    
    if (policy.writable) {
      existing.writable = [...new Set([...existing.writable || [], ...policy.writable])];
    }
    
    if (policy.denied) {
      existing.denied = [...new Set([...existing.denied || [], ...policy.denied])];
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
    organizationId: string
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
    organizationId: string
  ): Promise<{
    allowed: boolean;
    readableFields?: string[];
    writableFields?: string[];
    deniedFields?: string[];
  }> {
    const ability = await this.createForUser(user, organizationId, {
      includeFieldPermissions: true,
      resourceType: resource.constructor.name,
      resourceId: resource.id
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
      deniedFields: fieldPerms?.denied
    };
  }
}