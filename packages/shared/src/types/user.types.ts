import { BaseEntity, ContactInfo } from './common.types';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  GUEST = 'guest',
}

export interface User extends BaseEntity {
  cognitoId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  status: UserStatus;
  contactInfo?: ContactInfo;
  attributes?: UserAttributes;
  preferences?: UserPreferences;
  lastLoginAt?: Date;
  emailVerified: boolean;
  metadata?: Record<string, any>;
}

export interface UserAttributes {
  department?: string;
  jobTitle?: string;
  employeeId?: string;
  location?: string;
  customAttributes?: Record<string, any>;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  digest: 'daily' | 'weekly' | 'never';
}

export interface UserOrganizationMembership extends BaseEntity {
  userId: string;
  user?: User;
  organizationId: string;
  organization?: Organization;
  role: UserRole;
  permissions?: string[];
  isDefault: boolean;
  startDate: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  organizationId?: string;
  role?: UserRole;
  attributes?: Partial<UserAttributes>;
  preferences?: Partial<UserPreferences>;
}

export interface UpdateUserDto extends Partial<Omit<CreateUserDto, 'email' | 'password'>> {
  status?: UserStatus;
  displayName?: string;
}