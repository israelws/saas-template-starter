import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Territory } from '../entities/territory.entity';
import { 
  CreateTerritoryDto, 
  UpdateTerritoryDto,
  PaginationParams,
} from '@saas-template/shared';

/**
 * Service for managing territories
 * @class TerritoryService
 * @injectable
 */
@Injectable()
export class TerritoryService {
  constructor(
    @InjectRepository(Territory)
    private territoryRepository: Repository<Territory>,
  ) {}

  /**
   * Create a new territory
   * @param createDto - Territory creation data
   * @returns Created territory
   */
  async create(createDto: CreateTerritoryDto): Promise<Territory> {
    // Check if territory code already exists
    const existing = await this.territoryRepository.findOne({
      where: { code: createDto.code },
    });
    
    if (existing) {
      throw new BadRequestException('Territory code already exists');
    }

    // Validate parent territory if provided
    if (createDto.parentTerritoryId) {
      const parent = await this.territoryRepository.findOne({
        where: { id: createDto.parentTerritoryId },
      });
      
      if (!parent) {
        throw new BadRequestException('Parent territory not found');
      }
    }

    const territory = this.territoryRepository.create(createDto);
    return this.territoryRepository.save(territory);
  }

  /**
   * Find all territories with pagination
   * @param params - Pagination parameters
   * @param filters - Optional filters
   * @returns Paginated territories
   */
  async findAll(
    params: PaginationParams,
    filters?: {
      type?: 'zipcode' | 'city' | 'county' | 'state' | 'region';
      parentTerritoryId?: string;
    },
  ) {
    const query = this.territoryRepository.createQueryBuilder('territory')
      .leftJoinAndSelect('territory.parentTerritory', 'parent');

    if (filters?.type) {
      query.andWhere('territory.type = :type', { type: filters.type });
    }

    if (filters?.parentTerritoryId !== undefined) {
      if (filters.parentTerritoryId === null) {
        query.andWhere('territory.parentTerritoryId IS NULL');
      } else {
        query.andWhere('territory.parentTerritoryId = :parentId', { 
          parentId: filters.parentTerritoryId 
        });
      }
    }

    const [items, total] = await query
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getManyAndCount();

    return {
      items,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  /**
   * Find territory by ID
   * @param id - Territory ID
   * @returns Territory entity
   */
  async findOne(id: string): Promise<Territory> {
    const territory = await this.territoryRepository.findOne({
      where: { id },
      relations: ['parentTerritory'],
    });

    if (!territory) {
      throw new NotFoundException('Territory not found');
    }

    return territory;
  }

  /**
   * Find territory by code
   * @param code - Territory code
   * @returns Territory entity
   */
  async findByCode(code: string): Promise<Territory> {
    const territory = await this.territoryRepository.findOne({
      where: { code },
      relations: ['parentTerritory'],
    });

    if (!territory) {
      throw new NotFoundException('Territory not found');
    }

    return territory;
  }

  /**
   * Update territory
   * @param id - Territory ID
   * @param updateDto - Update data
   * @returns Updated territory
   */
  async update(id: string, updateDto: UpdateTerritoryDto): Promise<Territory> {
    const territory = await this.findOne(id);

    // Check if code is being changed and already exists
    if (updateDto.code && updateDto.code !== territory.code) {
      const existing = await this.territoryRepository.findOne({
        where: { code: updateDto.code },
      });
      
      if (existing) {
        throw new BadRequestException('Territory code already exists');
      }
    }

    // Validate parent territory if provided
    if (updateDto.parentTerritoryId !== undefined && updateDto.parentTerritoryId !== territory.parentTerritoryId) {
      if (updateDto.parentTerritoryId === null) {
        territory.parentTerritoryId = null;
      } else {
        const parent = await this.territoryRepository.findOne({
          where: { id: updateDto.parentTerritoryId },
        });
        
        if (!parent) {
          throw new BadRequestException('Parent territory not found');
        }

        // Prevent circular references
        if (parent.id === id) {
          throw new BadRequestException('Territory cannot be its own parent');
        }

        territory.parentTerritoryId = updateDto.parentTerritoryId;
      }
    }

    Object.assign(territory, updateDto);
    return this.territoryRepository.save(territory);
  }

  /**
   * Delete territory
   * @param id - Territory ID
   */
  async remove(id: string): Promise<void> {
    const territory = await this.findOne(id);
    
    // Check if territory has children
    const hasChildren = await this.territoryRepository.count({
      where: { parentTerritoryId: id },
    });
    
    if (hasChildren > 0) {
      throw new BadRequestException('Cannot delete territory with child territories');
    }

    await this.territoryRepository.remove(territory);
  }

  /**
   * Get territory hierarchy
   * @param rootId - Root territory ID (optional)
   * @returns Territory hierarchy tree
   */
  async getHierarchy(rootId?: string) {
    const query = this.territoryRepository.createQueryBuilder('territory');
    
    if (rootId) {
      query.where('territory.id = :rootId OR territory.parentTerritoryId = :rootId', { rootId });
    } else {
      query.where('territory.parentTerritoryId IS NULL');
    }

    const territories = await query.getMany();
    
    // Build hierarchy tree
    const buildTree = async (parentId: string | null) => {
      const children = await this.territoryRepository.find({
        where: { parentTerritoryId: parentId },
      });
      
      return Promise.all(children.map(async child => ({
        ...child,
        children: await buildTree(child.id),
      })));
    };

    return Promise.all(territories.map(async territory => ({
      ...territory,
      children: await buildTree(territory.id),
    })));
  }

  /**
   * Find territories by IDs
   * @param ids - Territory IDs
   * @returns Territories
   */
  async findByIds(ids: string[]): Promise<Territory[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.territoryRepository.findByIds(ids);
  }
}