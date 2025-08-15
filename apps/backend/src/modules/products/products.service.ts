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
        reserved: createProductDto.inventory.reserved || 0,
        available:
          createProductDto.inventory.available !== undefined
            ? createProductDto.inventory.available
            : createProductDto.inventory.quantity || 0,
        reorderLevel: createProductDto.inventory.reorderLevel || 0,
        reorderQuantity: createProductDto.inventory.reorderQuantity || 0,
        location: createProductDto.inventory.location,
      };
    }

    // Handle variants if provided
    if (createProductDto.variants && createProductDto.variants.length > 0) {
      // Validate variant SKUs are unique
      const variantSkus = createProductDto.variants.map((v) => v.sku);
      const uniqueSkus = new Set(variantSkus);
      if (uniqueSkus.size !== variantSkus.length) {
        throw new BadRequestException('Variant SKUs must be unique');
      }

      // Process variants with proper inventory initialization
      product.variants = createProductDto.variants.map((variant) => ({
        ...variant,
        id: undefined, // Let the frontend handle IDs
        inventory: variant.inventory
          ? {
              quantity: variant.inventory.quantity || 0,
              reserved: variant.inventory.reserved || 0,
              available:
                variant.inventory.available !== undefined
                  ? variant.inventory.available
                  : variant.inventory.quantity || 0,
              reorderLevel: variant.inventory.reorderLevel || 0,
              reorderQuantity: variant.inventory.reorderQuantity || 0,
              location: variant.inventory.location,
            }
          : undefined,
      }));
    }

    // Handle images if provided
    if (createProductDto.images) {
      product.images = createProductDto.images;
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

    // Ensure page and limit are numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

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
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    const [products, total] = await query.getManyAndCount();

    return {
      data: products,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
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
      const existing = await this.findBySku(updateProductDto.sku, product.organizationId);

      if (existing) {
        throw new BadRequestException('Product with this SKU already exists');
      }
    }

    // Handle inventory update with proper structure
    if (updateProductDto.inventory) {
      product.inventory = {
        quantity: updateProductDto.inventory.quantity ?? product.inventory?.quantity ?? 0,
        reserved: updateProductDto.inventory.reserved ?? product.inventory?.reserved ?? 0,
        available:
          updateProductDto.inventory.available !== undefined
            ? updateProductDto.inventory.available
            : (updateProductDto.inventory.quantity ?? product.inventory?.quantity ?? 0) -
              (updateProductDto.inventory.reserved ?? product.inventory?.reserved ?? 0),
        reorderLevel:
          updateProductDto.inventory.reorderLevel ?? product.inventory?.reorderLevel ?? 0,
        reorderQuantity:
          updateProductDto.inventory.reorderQuantity ?? product.inventory?.reorderQuantity ?? 0,
        location: updateProductDto.inventory.location ?? product.inventory?.location,
      };
    }

    // Handle variants update
    if (updateProductDto.variants !== undefined) {
      if (updateProductDto.variants.length > 0) {
        // Validate variant SKUs are unique
        const variantSkus = updateProductDto.variants.map((v) => v.sku);
        const uniqueSkus = new Set(variantSkus);
        if (uniqueSkus.size !== variantSkus.length) {
          throw new BadRequestException('Variant SKUs must be unique');
        }

        // Process variants with proper inventory initialization
        product.variants = updateProductDto.variants.map((variant) => ({
          ...variant,
          inventory: variant.inventory
            ? {
                quantity: variant.inventory.quantity || 0,
                reserved: variant.inventory.reserved || 0,
                available:
                  variant.inventory.available !== undefined
                    ? variant.inventory.available
                    : variant.inventory.quantity || 0,
                reorderLevel: variant.inventory.reorderLevel || 0,
                reorderQuantity: variant.inventory.reorderQuantity || 0,
                location: variant.inventory.location,
              }
            : undefined,
        }));
      } else {
        product.variants = [];
      }
    }

    // Handle images update
    if (updateProductDto.images !== undefined) {
      product.images = updateProductDto.images;
    }

    // Update other fields
    const { inventory, variants, images, ...otherFields } = updateProductDto;
    Object.assign(product, otherFields);

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
      .andWhere(
        "(product.inventory->>'available')::int <= (product.inventory->>'reorderLevel')::int",
      )
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
