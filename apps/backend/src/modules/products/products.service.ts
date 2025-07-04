import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import {
  CreateProductDto,
  UpdateProductDto,
  PaginationParams,
  PaginatedResponse,
  ProductStatus,
} from '@saas-template/shared';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Check if SKU already exists for this organization
    const existing = await this.productRepository.findOne({
      where: {
        sku: createProductDto.sku,
        organizationId: createProductDto.organizationId,
      },
    });

    if (existing) {
      throw new BadRequestException('Product with this SKU already exists');
    }

    const product = this.productRepository.create({
      ...createProductDto,
      status: ProductStatus.DRAFT,
      currency: createProductDto.currency || 'USD',
    });

    // Set default inventory if provided
    if (createProductDto.inventory) {
      product.inventory = {
        quantity: createProductDto.inventory.quantity || 0,
        reserved: 0,
        available: createProductDto.inventory.quantity || 0,
        reorderLevel: createProductDto.inventory.reorderLevel || 0,
        reorderQuantity: createProductDto.inventory.reorderQuantity || 0,
        location: createProductDto.inventory.location,
      };
    }

    return this.productRepository.save(product);
  }

  async findAll(
    organizationId: string,
    params: PaginationParams & { 
      status?: ProductStatus; 
      category?: string;
      search?: string;
    },
  ): Promise<PaginatedResponse<Product>> {
    const { 
      page, 
      limit, 
      sortBy = 'createdAt', 
      sortOrder = 'DESC',
      status,
      category,
      search,
    } = params;

    const query = this.productRepository.createQueryBuilder('product');
    
    query.where('product.organizationId = :organizationId', { organizationId });

    if (status) {
      query.andWhere('product.status = :status', { status });
    }

    if (category) {
      query.andWhere('product.category = :category', { category });
    }

    if (search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query
      .orderBy(`product.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [products, total] = await query.getManyAndCount();

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['organization'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findBySku(sku: string, organizationId: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { sku, organizationId },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // If updating SKU, check for duplicates
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existing = await this.findBySku(
        updateProductDto.sku,
        product.organizationId,
      );
      
      if (existing) {
        throw new BadRequestException('Product with this SKU already exists');
      }
    }

    Object.assign(product, updateProductDto);
    product.updatedAt = new Date();

    return this.productRepository.save(product);
  }

  async updateInventory(
    id: string,
    quantity: number,
    operation: 'set' | 'add' | 'subtract' = 'set',
  ): Promise<Product> {
    const product = await this.findOne(id);

    if (!product.inventory) {
      product.inventory = {
        quantity: 0,
        reserved: 0,
        available: 0,
        reorderLevel: 0,
        reorderQuantity: 0,
      };
    }

    switch (operation) {
      case 'add':
        product.inventory.quantity += quantity;
        break;
      case 'subtract':
        if (product.inventory.quantity < quantity) {
          throw new BadRequestException('Insufficient inventory');
        }
        product.inventory.quantity -= quantity;
        break;
      default:
        product.inventory.quantity = quantity;
    }

    // Update available quantity
    product.inventory.available = product.inventory.quantity - product.inventory.reserved;

    return this.productRepository.save(product);
  }

  async reserveInventory(id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(id);

    if (!product.inventory) {
      throw new BadRequestException('Product has no inventory tracking');
    }

    if (product.inventory.available < quantity) {
      throw new BadRequestException('Insufficient available inventory');
    }

    product.inventory.reserved += quantity;
    product.inventory.available = product.inventory.quantity - product.inventory.reserved;

    return this.productRepository.save(product);
  }

  async releaseInventory(id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(id);

    if (!product.inventory) {
      throw new BadRequestException('Product has no inventory tracking');
    }

    if (product.inventory.reserved < quantity) {
      throw new BadRequestException('Cannot release more than reserved quantity');
    }

    product.inventory.reserved -= quantity;
    product.inventory.available = product.inventory.quantity - product.inventory.reserved;

    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    
    // Soft delete by setting status to discontinued
    product.status = ProductStatus.DISCONTINUED;
    await this.productRepository.save(product);
  }

  async getLowStockProducts(organizationId: string): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.organizationId = :organizationId', { organizationId })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.inventory IS NOT NULL')
      .andWhere("(product.inventory->>'available')::int <= (product.inventory->>'reorderLevel')::int")
      .getMany();
  }

  async bulkUpdateStatus(
    ids: string[],
    status: ProductStatus,
    organizationId: string,
  ): Promise<void> {
    await this.productRepository
      .createQueryBuilder()
      .update(Product)
      .set({ status, updatedAt: new Date() })
      .where('id IN (:...ids)', { ids })
      .andWhere('organizationId = :organizationId', { organizationId })
      .execute();
  }
}