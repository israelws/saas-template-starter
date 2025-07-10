import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { UserAttribute } from '../entities/user-attribute.entity';
import { User } from '../entities/user.entity';
import { AttributeDefinition } from '../../abac/entities/attribute-definition.entity';
import { LoggerService } from '../../../common/logger/logger.service';

interface CreateUserAttributeDto {
  key: string;
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object';
  isPublic?: boolean;
  description?: string;
}

interface UpdateUserAttributeDto {
  value?: any;
  isPublic?: boolean;
  description?: string;
}

interface BulkUserAttributeOperationDto {
  operation: 'create' | 'update' | 'delete';
  userIds: string[];
  attributes: Array<{
    key: string;
    value?: any;
    dataType?: string;
    isPublic?: boolean;
    description?: string;
  }>;
}

interface PaginationParams {
  page: number;
  limit: number;
}

@Injectable()
export class UserAttributesService {
  private logger = new LoggerService('UserAttributesService');

  constructor(
    @InjectRepository(UserAttribute)
    private readonly userAttributeRepository: Repository<UserAttribute>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AttributeDefinition)
    private readonly attributeDefinitionRepository: Repository<AttributeDefinition>,
    private readonly dataSource: DataSource,
  ) {}

  async createAttribute(
    userId: string,
    organizationId: string,
    createAttributeDto: CreateUserAttributeDto,
  ): Promise<UserAttribute> {
    // Verify user exists and belongs to organization
    const user = await this.verifyUserInOrganization(userId, organizationId);

    // Check if attribute already exists
    const existingAttribute = await this.userAttributeRepository.findOne({
      where: {
        userId,
        organizationId,
        key: createAttributeDto.key,
      },
    });

    if (existingAttribute) {
      throw new BadRequestException(
        `Attribute with key '${createAttributeDto.key}' already exists for this user`,
      );
    }

    // Validate against attribute definition if exists
    await this.validateAttributeValue(organizationId, createAttributeDto.key, createAttributeDto.value);

    const attribute = this.userAttributeRepository.create({
      userId,
      organizationId,
      ...createAttributeDto,
      isPublic: createAttributeDto.isPublic ?? true,
    });

    const savedAttribute = await this.userAttributeRepository.save(attribute);

    this.logger.log({ message: "User attribute created", userId,
      organizationId,
      attributeKey: createAttributeDto.key,
      isPublic: attribute.isPublic,});

    return savedAttribute;
  }

  async getAttributes(
    userId: string,
    organizationId: string,
    includePrivate = false,
  ): Promise<UserAttribute[]> {
    await this.verifyUserInOrganization(userId, organizationId);

    const queryBuilder = this.userAttributeRepository
      .createQueryBuilder('attr')
      .where('attr.userId = :userId', { userId })
      .andWhere('attr.organizationId = :organizationId', { organizationId });

    if (!includePrivate) {
      queryBuilder.andWhere('attr.isPublic = true');
    }

    return queryBuilder
      .orderBy('attr.key', 'ASC')
      .getMany();
  }

  async getAttribute(
    userId: string,
    organizationId: string,
    key: string,
  ): Promise<UserAttribute> {
    await this.verifyUserInOrganization(userId, organizationId);

    const attribute = await this.userAttributeRepository.findOne({
      where: {
        userId,
        organizationId,
        key,
      },
    });

    if (!attribute) {
      throw new NotFoundException(`Attribute '${key}' not found for user`);
    }

    return attribute;
  }

  async updateAttribute(
    userId: string,
    organizationId: string,
    key: string,
    updateAttributeDto: UpdateUserAttributeDto,
  ): Promise<UserAttribute> {
    const attribute = await this.getAttribute(userId, organizationId, key);

    if (updateAttributeDto.value !== undefined) {
      await this.validateAttributeValue(organizationId, key, updateAttributeDto.value);
      attribute.value = updateAttributeDto.value;
    }

    if (updateAttributeDto.isPublic !== undefined) {
      attribute.isPublic = updateAttributeDto.isPublic;
    }

    if (updateAttributeDto.description !== undefined) {
      attribute.description = updateAttributeDto.description;
    }

    const savedAttribute = await this.userAttributeRepository.save(attribute);

    this.logger.log({ message: "User attribute updated", userId,
      organizationId,
      attributeKey: key,
      changes: updateAttributeDto,});

    return savedAttribute;
  }

  async deleteAttribute(
    userId: string,
    organizationId: string,
    key: string,
  ): Promise<void> {
    const attribute = await this.getAttribute(userId, organizationId, key);
    
    await this.userAttributeRepository.remove(attribute);

    this.logger.log({ message: "User attribute deleted", userId,
      organizationId,
      attributeKey: key,});
  }

  async bulkOperation(
    organizationId: string,
    operationDto: BulkUserAttributeOperationDto,
  ): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ userId: string; error: string }>;
  }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ userId: string; error: string }>,
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    for (const userId of operationDto.userIds) {
      await queryRunner.startTransaction();
      
      try {
        await this.verifyUserInOrganization(userId, organizationId);

        switch (operationDto.operation) {
          case 'create':
            for (const attr of operationDto.attributes) {
              await queryRunner.manager.save(UserAttribute, {
                userId,
                organizationId,
                key: attr.key,
                value: attr.value,
                dataType: attr.dataType || 'string',
                isPublic: attr.isPublic ?? true,
                description: attr.description,
              });
            }
            break;

          case 'update':
            for (const attr of operationDto.attributes) {
              await queryRunner.manager.update(
                UserAttribute,
                { userId, organizationId, key: attr.key },
                {
                  value: attr.value,
                  isPublic: attr.isPublic,
                  description: attr.description,
                }
              );
            }
            break;

          case 'delete':
            const keys = operationDto.attributes.map(attr => attr.key);
            await queryRunner.manager.delete(UserAttribute, {
              userId,
              organizationId,
              key: queryRunner.manager.getRepository(UserAttribute)
                .createQueryBuilder()
                .select()
                .where('key IN (:...keys)', { keys })
                .getQuery()
            });
            break;
        }

        await queryRunner.commitTransaction();
        results.successful++;

      } catch (error) {
        await queryRunner.rollbackTransaction();
        results.failed++;
        results.errors.push({
          userId,
          error: error.message,
        });
      }
    }

    await queryRunner.release();

    this.logger.log({ message: "Bulk user attribute operation completed", organizationId,
      operation: operationDto.operation,
      successful: results.successful,
      failed: results.failed,
      totalUsers: operationDto.userIds.length,});

    return results;
  }

  async searchUsersByAttribute(
    organizationId: string,
    key: string,
    value?: string,
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' = 'equals',
    pagination: PaginationParams = { page: 1, limit: 20 },
  ) {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.attributes', 'attr')
      .leftJoinAndSelect('user.organizationMemberships', 'membership')
      .where('membership.organizationId = :organizationId', { organizationId })
      .andWhere('attr.organizationId = :organizationId', { organizationId })
      .andWhere('attr.key = :key', { key });

    if (value !== undefined) {
      switch (operator) {
        case 'equals':
          queryBuilder.andWhere('attr.value = :value', { value });
          break;
        case 'contains':
          queryBuilder.andWhere('attr.value::text ILIKE :value', { value: `%${value}%` });
          break;
        case 'greater_than':
          queryBuilder.andWhere('attr.value::numeric > :value', { value: parseFloat(value) });
          break;
        case 'less_than':
          queryBuilder.andWhere('attr.value::numeric < :value', { value: parseFloat(value) });
          break;
      }
    }

    const [users, total] = await queryBuilder
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getManyAndCount();

    return {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        attributes: user.userAttributes?.reduce((acc, attr) => {
          acc[attr.key] = attr.value;
          return acc;
        }, {} as Record<string, any>) || {},
      })),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async getAvailableAttributeDefinitions(organizationId: string) {
    return this.attributeDefinitionRepository.find({
      where: [
        { organizationId },
        { isSystem: true },
      ],
      order: { name: 'ASC' },
    });
  }

  private async verifyUserInOrganization(userId: string, organizationId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['memberships'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMember = user.memberships?.some(m => m.organizationId === organizationId);
    if (!isMember) {
      throw new NotFoundException('User not found in organization');
    }

    return user;
  }

  private async validateAttributeValue(
    organizationId: string,
    key: string,
    value: any,
  ): Promise<void> {
    const definition = await this.attributeDefinitionRepository.findOne({
      where: [
        { organizationId, name: key },
        { isSystem: true, name: key },
      ],
    });

    if (!definition) {
      // No definition found, allow any value
      return;
    }

    // Validate data type
    const expectedType = definition.dataType;
    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (expectedType !== actualType && expectedType !== 'object') {
      throw new BadRequestException(
        `Attribute '${key}' expects ${expectedType} but received ${actualType}`,
      );
    }

    // Validate against rules if they exist
    if (definition.allowedValues || definition.possibleValues) {
      const rules = (definition.allowedValues || definition.possibleValues) as any;

      if (rules.required && (value === null || value === undefined || value === '')) {
        throw new BadRequestException(`Attribute '${key}' is required`);
      }

      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        throw new BadRequestException(
          `Attribute '${key}' must be at least ${rules.minLength} characters`,
        );
      }

      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        throw new BadRequestException(
          `Attribute '${key}' must not exceed ${rules.maxLength} characters`,
        );
      }

      if (rules.min && typeof value === 'number' && value < rules.min) {
        throw new BadRequestException(`Attribute '${key}' must be at least ${rules.min}`);
      }

      if (rules.max && typeof value === 'number' && value > rules.max) {
        throw new BadRequestException(`Attribute '${key}' must not exceed ${rules.max}`);
      }

      if (rules.enum && !rules.enum.includes(value)) {
        throw new BadRequestException(
          `Attribute '${key}' must be one of: ${rules.enum.join(', ')}`,
        );
      }

      if (rules.pattern && typeof value === 'string' && !new RegExp(rules.pattern).test(value)) {
        throw new BadRequestException(`Attribute '${key}' does not match required pattern`);
      }
    }
  }
}