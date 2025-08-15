import { BaseEntity, Address, ContactInfo } from './common.types';

export enum CustomerType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
}

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BLACKLISTED = 'blacklisted',
}

export interface Customer extends BaseEntity {
  type: CustomerType;
  status: CustomerStatus;
  organizationId: string;

  // Individual customer fields
  firstName?: string;
  lastName?: string;

  // Business customer fields
  companyName?: string;
  taxId?: string;

  // Common fields
  email: string;
  contactInfo?: ContactInfo;
  billingAddress?: Address;
  shippingAddress?: Address;
  creditLimit?: number;
  balance?: number;
  currency: string;
  preferences?: CustomerPreferences;
  metadata?: Record<string, any>;
}

export interface CustomerPreferences {
  communicationChannel: 'email' | 'phone' | 'sms' | 'none';
  language: string;
  invoiceDelivery: 'email' | 'mail' | 'both';
  paymentTerms?: number; // days
  customPreferences?: Record<string, any>;
}

export interface CreateCustomerDto {
  type: CustomerType;
  email: string;
  organizationId: string;

  // Individual fields
  firstName?: string;
  lastName?: string;

  // Business fields
  companyName?: string;
  taxId?: string;

  contactInfo?: ContactInfo;
  billingAddress?: Address;
  shippingAddress?: Address;
  creditLimit?: number;
  currency?: string;
  preferences?: Partial<CustomerPreferences>;
  metadata?: Record<string, any>;
}

export interface UpdateCustomerDto
  extends Partial<Omit<CreateCustomerDto, 'type' | 'organizationId'>> {
  status?: CustomerStatus;
  balance?: number;
}
