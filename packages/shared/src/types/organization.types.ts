import { BaseEntity } from './common.types';

export enum OrganizationType {
  COMPANY = 'company',
  DIVISION = 'division',
  DEPARTMENT = 'department',
  TEAM = 'team',
  INSURANCE_AGENCY = 'insurance_agency',
  INSURANCE_BRANCH = 'insurance_branch',
}

export interface Organization extends BaseEntity {
  name: string;
  type: OrganizationType;
  description?: string;
  code?: string;
  parentId?: string;
  parent?: Organization;
  children?: Organization[];
  settings?: OrganizationSettings;
  metadata?: Record<string, any>;
  isActive: boolean;
  path?: string; // Materialized path for efficient queries
}

export interface OrganizationSettings {
  allowSubOrganizations: boolean;
  maxDepth: number;
  features: string[];
  customFields?: Record<string, any>;
}

export interface OrganizationHierarchy {
  id: string;
  name: string;
  type: OrganizationType;
  children: OrganizationHierarchy[];
}

export interface CreateOrganizationDto {
  name: string;
  type: OrganizationType;
  description?: string;
  code?: string;
  parentId?: string;
  settings?: Partial<OrganizationSettings>;
  metadata?: Record<string, any>;
}

export interface UpdateOrganizationDto extends Partial<CreateOrganizationDto> {
  isActive?: boolean;
}
