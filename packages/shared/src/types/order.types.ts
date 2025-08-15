import { BaseEntity, Address } from './common.types';
import { Product } from './product.types';
import { Customer } from './customer.types';

export enum OrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  PICKUP = 'pickup',
}

export interface Order extends BaseEntity {
  orderNumber: string;
  customerId: string;
  customer?: Customer;
  organizationId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  orderDate: Date;
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethod: ShippingMethod;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  items: OrderItem[];
  notes?: string;
  metadata?: Record<string, any>;
}

export interface OrderItem extends BaseEntity {
  orderId: string;
  order?: Order;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface CreateOrderDto {
  customerId: string;
  organizationId: string;
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethod: ShippingMethod;
  items: CreateOrderItemDto[];
  notes?: string;
  metadata?: Record<string, any>;
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  unitPrice?: number; // If not provided, use product price
  discount?: number;
  notes?: string;
}

export interface UpdateOrderDto
  extends Partial<Omit<CreateOrderDto, 'customerId' | 'organizationId' | 'items'>> {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
}
