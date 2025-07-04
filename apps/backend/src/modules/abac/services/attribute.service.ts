import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeDefinition } from '../entities/attribute-definition.entity';
import {
  AttributeCategory,
  AttributeType,
  PaginationParams,
  PaginatedResponse,
} from '@saas-template/shared';

@Injectable()
export class AttributeService {
  constructor(
    @InjectRepository(AttributeDefinition)
    private readonly attributeRepository: Repository<AttributeDefinition>,
  ) {}

  async create(
    name: string,
    category: AttributeCategory,
    type: AttributeType,
    description?: string,
    organizationId?: string,
  ): Promise<AttributeDefinition> {
    // Check if attribute already exists
    const existing = await this.attributeRepository.findOne({
      where: { name, organizationId },
    });

    if (existing) {
      throw new BadRequestException('Attribute with this name already exists');
    }

    const attribute = this.attributeRepository.create({
      name,
      category,
      type,
      description,
      organizationId,
      isSystem: false,
    });

    return this.attributeRepository.save(attribute);
  }

  async findAll(
    params: PaginationParams & { category?: AttributeCategory; organizationId?: string },
  ): Promise<PaginatedResponse<AttributeDefinition>> {
    const { page, limit, sortBy = 'name', sortOrder = 'ASC', category, organizationId } = params;

    const query = this.attributeRepository.createQueryBuilder('attribute');

    if (category) {
      query.andWhere('attribute.category = :category', { category });
    }

    if (organizationId) {
      query.andWhere(
        '(attribute.organizationId = :organizationId OR attribute.organizationId IS NULL)',
        { organizationId },
      );
    } else {
      query.andWhere('attribute.organizationId IS NULL');
    }

    query
      .orderBy(`attribute.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [attributes, total] = await query.getManyAndCount();

    return {
      data: attributes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<AttributeDefinition> {
    const attribute = await this.attributeRepository.findOne({
      where: { id },
      relations: ['organization'],
    });

    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }

    return attribute;
  }

  async findByCategory(
    category: AttributeCategory,
    organizationId?: string,
  ): Promise<AttributeDefinition[]> {
    const query = this.attributeRepository.createQueryBuilder('attribute');
    
    query.where('attribute.category = :category', { category });

    if (organizationId) {
      query.andWhere(
        '(attribute.organizationId = :organizationId OR attribute.organizationId IS NULL)',
        { organizationId },
      );
    } else {
      query.andWhere('attribute.organizationId IS NULL');
    }

    return query.getMany();
  }

  async update(
    id: string,
    updates: Partial<AttributeDefinition>,
  ): Promise<AttributeDefinition> {
    const attribute = await this.findOne(id);

    if (attribute.isSystem) {
      throw new BadRequestException('Cannot modify system attributes');
    }

    Object.assign(attribute, updates);
    attribute.updatedAt = new Date();

    return this.attributeRepository.save(attribute);
  }

  async remove(id: string): Promise<void> {
    const attribute = await this.findOne(id);

    if (attribute.isSystem) {
      throw new BadRequestException('Cannot delete system attributes');
    }

    await this.attributeRepository.remove(attribute);
  }

  async seedSystemAttributes(): Promise<void> {
    const systemAttributes = [
      // User attributes
      {
        name: 'user.id',
        category: AttributeCategory.USER,
        type: AttributeType.STRING,
        description: 'User ID',
        isSystem: true,
        isRequired: true,
      },
      {
        name: 'user.email',
        category: AttributeCategory.USER,
        type: AttributeType.STRING,
        description: 'User email address',
        isSystem: true,
        isRequired: true,
      },
      {
        name: 'user.role',
        category: AttributeCategory.USER,
        type: AttributeType.STRING,
        description: 'User role in organization',
        isSystem: true,
        isRequired: true,
      },
      {
        name: 'user.organizationId',
        category: AttributeCategory.USER,
        type: AttributeType.STRING,
        description: 'User organization ID',
        isSystem: true,
        isRequired: true,
      },
      {
        name: 'user.department',
        category: AttributeCategory.USER,
        type: AttributeType.STRING,
        description: 'User department',
        isSystem: true,
        isRequired: false,
      },
      // Resource attributes
      {
        name: 'resource.type',
        category: AttributeCategory.RESOURCE,
        type: AttributeType.STRING,
        description: 'Resource type',
        isSystem: true,
        isRequired: true,
      },
      {
        name: 'resource.id',
        category: AttributeCategory.RESOURCE,
        type: AttributeType.STRING,
        description: 'Resource ID',
        isSystem: true,
        isRequired: false,
      },
      {
        name: 'resource.organizationId',
        category: AttributeCategory.RESOURCE,
        type: AttributeType.STRING,
        description: 'Resource organization ID',
        isSystem: true,
        isRequired: true,
      },
      {
        name: 'resource.ownerId',
        category: AttributeCategory.RESOURCE,
        type: AttributeType.STRING,
        description: 'Resource owner ID',
        isSystem: true,
        isRequired: false,
      },
      // Environment attributes
      {
        name: 'env.time',
        category: AttributeCategory.ENVIRONMENT,
        type: AttributeType.STRING,
        description: 'Current time (HH:MM)',
        isSystem: true,
        isRequired: false,
      },
      {
        name: 'env.date',
        category: AttributeCategory.ENVIRONMENT,
        type: AttributeType.DATE,
        description: 'Current date',
        isSystem: true,
        isRequired: false,
      },
      {
        name: 'env.dayOfWeek',
        category: AttributeCategory.ENVIRONMENT,
        type: AttributeType.NUMBER,
        description: 'Day of week (0-6)',
        isSystem: true,
        isRequired: false,
      },
      {
        name: 'env.ipAddress',
        category: AttributeCategory.ENVIRONMENT,
        type: AttributeType.STRING,
        description: 'Client IP address',
        isSystem: true,
        isRequired: false,
      },
      {
        name: 'env.location',
        category: AttributeCategory.ENVIRONMENT,
        type: AttributeType.STRING,
        description: 'Client location',
        isSystem: true,
        isRequired: false,
      },
    ];

    for (const attr of systemAttributes) {
      const existing = await this.attributeRepository.findOne({
        where: { name: attr.name },
      });

      if (!existing) {
        await this.attributeRepository.save(this.attributeRepository.create(attr));
      }
    }
  }

  async getAttributesByContext(
    organizationId: string,
  ): Promise<{
    user: AttributeDefinition[];
    resource: AttributeDefinition[];
    environment: AttributeDefinition[];
  }> {
    const [user, resource, environment] = await Promise.all([
      this.findByCategory(AttributeCategory.USER, organizationId),
      this.findByCategory(AttributeCategory.RESOURCE, organizationId),
      this.findByCategory(AttributeCategory.ENVIRONMENT, organizationId),
    ]);

    return { user, resource, environment };
  }
}