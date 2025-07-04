import { BaseEntity } from './common.types';

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
  DRAFT = 'draft',
}

export enum ProductCategory {
  ELECTRONICS = 'electronics',
  SOFTWARE = 'software',
  SERVICES = 'services',
  HARDWARE = 'hardware',
  SUBSCRIPTION = 'subscription',
  OTHER = 'other',
}

export interface Product extends BaseEntity {
  sku: string;
  name: string;
  description?: string;
  category: ProductCategory;
  price: number;
  currency: string;
  status: ProductStatus;
  organizationId: string;
  attributes?: ProductAttributes;
  inventory?: ProductInventory;
  metadata?: Record<string, any>;
}

export interface ProductAttributes {
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  color?: string;
  material?: string;
  manufacturer?: string;
  warrantyPeriod?: number; // in months
  customAttributes?: Record<string, any>;
}

export interface ProductInventory {
  quantity: number;
  reserved: number;
  available: number;
  reorderLevel: number;
  reorderQuantity: number;
  location?: string;
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  category: ProductCategory;
  price: number;
  currency?: string;
  organizationId: string;
  attributes?: Partial<ProductAttributes>;
  inventory?: Partial<ProductInventory>;
  metadata?: Record<string, any>;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  status?: ProductStatus;
}