import { BaseEntity } from './common.types';

/**
 * Types of insurance products an agent can sell
 */
export enum InsuranceType {
  LIFE = 'life',
  HEALTH = 'health',
  PROPERTY = 'property',
  CASUALTY = 'casualty',
  AUTO = 'auto',
  DISABILITY = 'disability',
  LONG_TERM_CARE = 'long_term_care',
  BUSINESS = 'business',
}

/**
 * Agent license status
 */
export enum LicenseStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

/**
 * Insurance agent profile
 */
export interface InsuranceAgent extends BaseEntity {
  userId: string;
  branchId: string;
  agentCode: string;
  licenseNumber: string;
  licenseType: InsuranceType[];
  licenseStatus: LicenseStatus;
  licenseExpiryDate: Date;
  commissionRate: number;
  specializations: InsuranceType[];
  territoryIds?: string[];
  performanceMetrics?: AgentPerformanceMetrics;
  metadata?: Record<string, any>;
  isActive: boolean;
}

/**
 * Agent performance metrics
 */
export interface AgentPerformanceMetrics {
  totalPoliciesSold: number;
  totalPremiumVolume: number;
  averagePolicyValue: number;
  customerRetentionRate: number;
  lastUpdated: Date;
}

/**
 * Insurance branch details
 */
export interface InsuranceBranch extends BaseEntity {
  organizationId: string;
  branchCode: string;
  branchName: string;
  managerId?: string;
  address: BranchAddress;
  phoneNumber: string;
  email: string;
  operatingHours: OperatingHours;
  serviceTypes: InsuranceType[];
  territoryIds: string[];
  metadata?: Record<string, any>;
  isActive: boolean;
}

/**
 * Branch address
 */
export interface BranchAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Operating hours for each day
 */
export interface OperatingHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string; // "09:00"
  close: string; // "17:00"
  isClosed?: boolean;
}

/**
 * Territory definition
 */
export interface Territory extends BaseEntity {
  name: string;
  code: string;
  type: 'zipcode' | 'city' | 'county' | 'state' | 'region';
  parentTerritoryId?: string;
  boundaries?: any; // GeoJSON data
  metadata?: Record<string, any>;
}

// DTOs
export interface CreateInsuranceAgentDto {
  userId: string;
  branchId: string;
  agentCode: string;
  licenseNumber: string;
  licenseType: InsuranceType[];
  licenseExpiryDate: Date;
  commissionRate: number;
  specializations?: InsuranceType[];
  territoryIds?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateInsuranceAgentDto extends Partial<CreateInsuranceAgentDto> {
  licenseStatus?: LicenseStatus;
  isActive?: boolean;
}

export interface CreateInsuranceBranchDto {
  organizationId: string;
  branchCode: string;
  branchName: string;
  managerId?: string;
  address: BranchAddress;
  phoneNumber: string;
  email: string;
  operatingHours: OperatingHours;
  serviceTypes: InsuranceType[];
  territoryIds?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateInsuranceBranchDto extends Partial<CreateInsuranceBranchDto> {
  isActive?: boolean;
}

export interface CreateTerritoryDto {
  name: string;
  code: string;
  type: 'zipcode' | 'city' | 'county' | 'state' | 'region';
  parentTerritoryId?: string;
  boundaries?: any;
  metadata?: Record<string, any>;
}

export interface UpdateTerritoryDto extends Partial<CreateTerritoryDto> {}
