import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductRepository extends Repository<Product> {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
    super(Product, dataSource.createEntityManager());
  }

  async findByOrganization(organizationId: string, includeDescendants = false): Promise<Product[]> {
    if (!includeDescendants) {
      return this.find({
        where: { organizationId },
        order: { createdAt: 'DESC' },
      });
    }

    const queryBuilder = this.createQueryBuilder('product')
      .innerJoin(
        'organizations_closure',
        'closure',
        'closure.descendantId = product.organizationId',
      )
      .where('closure.ancestorId = :organizationId', { organizationId })
      .orderBy('product.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async findBySku(sku: string, organizationId?: string): Promise<Product | null> {
    const whereClause: any = { sku };
    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    return this.findOne({ where: whereClause });
  }

  async searchProducts(
    searchTerm: string,
    filters?: {
      organizationId?: string;
      status?: string;
      minPrice?: number;
      maxPrice?: number;
      category?: string;
      inStock?: boolean;
    },
  ): Promise<Product[]> {
    const queryBuilder = this.createQueryBuilder('product');

    if (searchTerm) {
      queryBuilder.where(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${searchTerm}%` },
      );
    }

    if (filters?.organizationId) {
      queryBuilder.andWhere('product.organizationId = :organizationId', {
        organizationId: filters.organizationId,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('product.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters?.maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters?.category) {
      queryBuilder.andWhere("product.attributes->>'category' = :category", {
        category: filters.category,
      });
    }

    if (filters?.inStock !== undefined) {
      if (filters.inStock) {
        queryBuilder.andWhere("(product.inventory->>'quantity')::int > 0");
      } else {
        queryBuilder.andWhere("(product.inventory->>'quantity')::int = 0");
      }
    }

    return queryBuilder.orderBy('product.name', 'ASC').getMany();
  }

  async updateStock(
    productId: string,
    quantity: number,
    operation: 'increment' | 'decrement' | 'set',
  ): Promise<Product> {
    const product = await this.findOne({ where: { id: productId } });
    if (!product) {
      throw new Error('Product not found');
    }

    switch (operation) {
      case 'increment':
        if (!product.inventory) {
          product.inventory = {
            quantity: 0,
            reserved: 0,
            available: 0,
            reorderLevel: 0,
            reorderQuantity: 0,
          };
        }
        product.inventory.quantity = (product.inventory.quantity || 0) + quantity;
        break;
      case 'decrement':
        if (!product.inventory) {
          product.inventory = {
            quantity: 0,
            reserved: 0,
            available: 0,
            reorderLevel: 0,
            reorderQuantity: 0,
          };
        }
        product.inventory.quantity = Math.max(0, (product.inventory.quantity || 0) - quantity);
        break;
      case 'set':
        if (!product.inventory) {
          product.inventory = {
            quantity: 0,
            reserved: 0,
            available: 0,
            reorderLevel: 0,
            reorderQuantity: 0,
          };
        }
        product.inventory.quantity = Math.max(0, quantity);
        break;
    }

    return this.save(product);
  }

  async bulkUpdatePrices(updates: Array<{ productId: string; price: number }>): Promise<void> {
    const promises = updates.map(({ productId, price }) => this.update(productId, { price }));

    await Promise.all(promises);
  }

  async getProductStats(organizationId?: string): Promise<{
    totalProducts: number;
    activeProducts: number;
    totalValue: number;
    outOfStock: number;
    categoryCounts: Record<string, number>;
  }> {
    let queryBuilder = this.createQueryBuilder('product');

    if (organizationId) {
      queryBuilder = queryBuilder
        .innerJoin(
          'organizations_closure',
          'closure',
          'closure.descendantId = product.organizationId',
        )
        .where('closure.ancestorId = :organizationId', { organizationId });
    }

    const products = await queryBuilder.getMany();

    const stats = {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.status === 'active').length,
      totalValue: products.reduce((sum, p) => sum + p.price * (p.inventory?.quantity || 0), 0),
      outOfStock: products.filter((p) => (p.inventory?.quantity || 0) === 0).length,
      categoryCounts: {} as Record<string, number>,
    };

    products.forEach((product) => {
      // Assuming category is a top-level field or in metadata
      const category = product.metadata?.category || 'Uncategorized';
      stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;
    });

    return stats;
  }

  async findLowStockProducts(threshold: number, organizationId?: string): Promise<Product[]> {
    const queryBuilder = this.createQueryBuilder('product')
      .where("(product.inventory->>'quantity')::int <= :threshold", { threshold })
      .andWhere("(product.inventory->>'quantity')::int > 0")
      .andWhere('product.status = :status', { status: 'active' });

    if (organizationId) {
      queryBuilder.andWhere('product.organizationId = :organizationId', {
        organizationId,
      });
    }

    return queryBuilder.orderBy("(product.inventory->>'quantity')::int", 'ASC').getMany();
  }

  async cloneProduct(
    productId: string,
    targetOrganizationId: string,
    newSku: string,
  ): Promise<Product> {
    const originalProduct = await this.findOne({
      where: { id: productId },
    });

    if (!originalProduct) {
      throw new Error('Product not found');
    }

    const clonedProduct = this.create({
      ...originalProduct,
      id: undefined,
      sku: newSku,
      organizationId: targetOrganizationId,
      createdAt: undefined,
      updatedAt: undefined,
    });

    return this.save(clonedProduct);
  }
}
