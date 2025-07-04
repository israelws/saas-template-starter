import { BaseEntity } from './common.types';

export enum PolicyEffect {
  ALLOW = 'allow',
  DENY = 'deny',
}

export enum AttributeType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ARRAY = 'array',
  OBJECT = 'object',
}

export enum AttributeCategory {
  USER = 'user',
  RESOURCE = 'resource',
  ENVIRONMENT = 'environment',
  ACTION = 'action',
}

export interface AttributeDefinition extends BaseEntity {
  name: string;
  category: AttributeCategory;
  type: AttributeType;
  description?: string;
  possibleValues?: any[];
  defaultValue?: any;
  isRequired: boolean;
  isSystem: boolean;
  organizationId?: string;
  metadata?: Record<string, any>;
}

export interface Policy extends BaseEntity {
  name: string;
  description?: string;
  effect: PolicyEffect;
  priority: number;
  subjects: PolicySubjects;
  resources: PolicyResources;
  actions: string[];
  conditions?: PolicyConditions;
  organizationId: string;
  policySetId?: string;
  isActive: boolean;
  version: number;
  metadata?: Record<string, any>;
}

export interface PolicySubjects {
  users?: string[];
  groups?: string[];
  roles?: string[];
  attributes?: Record<string, any>;
}

export interface PolicyResources {
  types?: string[];
  ids?: string[];
  attributes?: Record<string, any>;
}

export interface PolicyConditions {
  timeWindow?: TimeWindow;
  ipAddresses?: string[];
  locations?: string[];
  customConditions?: Record<string, any>;
}

export interface TimeWindow {
  start?: string; // ISO time string
  end?: string; // ISO time string
  timezone?: string;
  daysOfWeek?: number[]; // 0-6, where 0 is Sunday
}

export interface PolicySet extends BaseEntity {
  name: string;
  description?: string;
  organizationId: string;
  policies: Policy[];
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface PolicyEvaluationContext {
  subject: {
    id: string;
    roles: string[];
    groups: string[];
    attributes: Record<string, any>;
  };
  resource: {
    type: string;
    id?: string;
    attributes: Record<string, any>;
  };
  action: string;
  environment: {
    timestamp: Date;
    ipAddress?: string;
    location?: string;
    attributes: Record<string, any>;
  };
  organizationId: string;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  matchedPolicies: Policy[];
  deniedPolicies: Policy[];
  reasons: string[];
  evaluationTime: number; // milliseconds
}

export interface CreatePolicyDto {
  name: string;
  description?: string;
  effect: PolicyEffect;
  priority?: number;
  subjects: PolicySubjects;
  resources: PolicyResources;
  actions: string[];
  conditions?: PolicyConditions;
  organizationId: string;
  policySetId?: string;
}

export interface UpdatePolicyDto extends Partial<CreatePolicyDto> {
  isActive?: boolean;
}