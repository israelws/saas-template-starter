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
  images?: ProductImage[];
  variants?: ProductVariant[];
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

export interface ProductImage {
  id?: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
  order: number;
}

export interface ProductVariant {
  id?: string;
  sku: string;
  name: string;
  price?: number;
  inventory?: ProductInventory;
  attributes?: {
    size?: string;
    color?: string;
    material?: string;
    [key: string]: any;
  };
  images?: ProductImage[];
  isActive: boolean;
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
  images?: ProductImage[];
  variants?: Omit<ProductVariant, 'id'>[];
  metadata?: Record<string, any>;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  status?: ProductStatus;
}