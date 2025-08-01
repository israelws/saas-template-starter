import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { AttributeDefinition } from '../entities/attribute-definition.entity';
import { CreateAttributeDto } from '../dto/create-attribute.dto';
import { UpdateAttributeDto } from '../dto/update-attribute.dto';
import {
  PaginationParams,
  PaginatedResponse,
  AttributeCategory,
  AttributeType,
} from '@saas-template/shared';

@Injectable()
export class AttributeService {
  constructor(
    @InjectRepository(AttributeDefinition)
    private readonly attributeRepository: Repository<AttributeDefinition>,
  ) {}

  async create(createAttributeDto: CreateAttributeDto): Promise<AttributeDefinition> {
    const { key, name, description, category, type, dataType, isRequired, defaultValue, allowedValues, organizationId } = createAttributeDto;
    
    // Check if attribute key already exists
    const existing = await this.attributeRepository.findOne({
      where: { key },
    });

    if (existing) {
      throw new ConflictException('Attribute with this key already exists');
    }

    const attribute = this.attributeRepository.create({
      key,
      name,
      description,
      category,
      type: dataType || type,
      dataType: dataType || type,
      isRequired: isRequired || false,
      defaultValue,
      allowedValues,
      organizationId,
      isSystem: false,
    });

    return this.attributeRepository.save(attribute);
  }

  async findAll(params: {
    category?: string;
    type?: string;
    search?: string;
  }): Promise<AttributeDefinition[]> {
    const { category, type, search } = params;

    const query = this.attributeRepository.createQueryBuilder('attribute');

    if (category && category !== 'all') {
      query.andWhere('attribute.category = :category', { category });
    }

    if (type && type !== 'all') {
      query.andWhere('attribute.type = :type', { type });
    }

    if (search) {
      query.andWhere(
        '(attribute.key ILIKE :search OR attribute.name ILIKE :search OR attribute.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    query.orderBy('attribute.name', 'ASC');

    return query.getMany();
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
    updateAttributeDto: UpdateAttributeDto,
  ): Promise<AttributeDefinition> {
    const attribute = await this.findOne(id);

    if (attribute.isSystem) {
      throw new BadRequestException('Cannot modify system attributes');
    }

    // Update only provided fields
    if (updateAttributeDto.name !== undefined) {
      attribute.name = updateAttributeDto.name;
    }
    if (updateAttributeDto.description !== undefined) {
      attribute.description = updateAttributeDto.description;
    }
    if (updateAttributeDto.isRequired !== undefined) {
      attribute.isRequired = updateAttributeDto.isRequired;
    }
    if (updateAttributeDto.defaultValue !== undefined) {
      attribute.defaultValue = updateAttributeDto.defaultValue;
    }
    if (updateAttributeDto.allowedValues !== undefined) {
      attribute.allowedValues = updateAttributeDto.allowedValues;
    }
    
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

  async createBulk(createAttributeDtos: CreateAttributeDto[]): Promise<AttributeDefinition[]> {
    const createdAttributes: AttributeDefinition[] = [];
    
    for (const dto of createAttributeDtos) {
      try {
        const attribute = await this.create(dto);
        createdAttributes.push(attribute);
      } catch (error) {
        // Continue with other attributes if one fails
        console.error(`Failed to create attribute ${dto.key}:`, error);
      }
    }
    
    return createdAttributes;
  }

  async validateValue(attributeKey: string, value: any): Promise<{ valid: boolean; errors?: string[] }> {
    const attribute = await this.attributeRepository.findOne({
      where: { key: attributeKey },
    });

    if (!attribute) {
      return { valid: false, errors: ['Attribute not found'] };
    }

    const errors: string[] = [];

    // Type validation
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (attribute.type === 'object' && actualType !== 'object') {
      errors.push(`Expected type ${attribute.type}, got ${actualType}`);
    } else if (attribute.type !== 'object' && attribute.type !== 'array' && actualType !== attribute.type) {
      errors.push(`Expected type ${attribute.type}, got ${actualType}`);
    }

    // Required validation
    if (attribute.isRequired && (value === null || value === undefined || value === '')) {
      errors.push('Value is required');
    }

    // Allowed values validation
    if (attribute.allowedValues && attribute.allowedValues.length > 0) {
      if (!attribute.allowedValues.includes(value)) {
        errors.push(`Value must be one of: ${attribute.allowedValues.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}