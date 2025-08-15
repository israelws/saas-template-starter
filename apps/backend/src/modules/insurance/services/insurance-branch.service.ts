import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InsuranceBranch } from '../entities/insurance-branch.entity';
import {
  CreateInsuranceBranchDto,
  UpdateInsuranceBranchDto,
  PaginationParams,
  OrganizationType,
} from '@saas-template/shared';
import { OrganizationsService } from '../../organizations/organizations.service';

/**
 * Service for managing insurance branches
 * @class InsuranceBranchService
 * @injectable
 */
@Injectable()
export class InsuranceBranchService {
  constructor(
    @InjectRepository(InsuranceBranch)
    private branchRepository: Repository<InsuranceBranch>,
    private organizationsService: OrganizationsService,
  ) {}

  /**
   * Create a new insurance branch
   * @param createDto - Branch creation data
   * @returns Created branch
   */
  async create(createDto: CreateInsuranceBranchDto): Promise<InsuranceBranch> {
    // Verify organization exists and is of type insurance_branch
    const organization = await this.organizationsService.findOne(createDto.organizationId);

    if (organization.type !== OrganizationType.INSURANCE_BRANCH) {
      throw new BadRequestException('Organization must be of type insurance_branch');
    }

    // Check if branch code already exists
    const existing = await this.branchRepository.findOne({
      where: { branchCode: createDto.branchCode },
    });

    if (existing) {
      throw new BadRequestException('Branch code already exists');
    }

    const branch = this.branchRepository.create(createDto);
    return this.branchRepository.save(branch);
  }

  /**
   * Find all branches with pagination
   * @param params - Pagination parameters
   * @param filters - Optional filters
   * @returns Paginated branches
   */
  async findAll(
    params: PaginationParams,
    filters?: {
      organizationId?: string;
      managerId?: string;
      isActive?: boolean;
    },
  ) {
    const query = this.branchRepository
      .createQueryBuilder('branch')
      .leftJoinAndSelect('branch.organization', 'organization')
      .leftJoinAndSelect('branch.manager', 'manager')
      .leftJoinAndSelect('branch.agents', 'agents');

    if (filters?.organizationId) {
      query.andWhere('branch.organizationId = :orgId', { orgId: filters.organizationId });
    }

    if (filters?.managerId) {
      query.andWhere('branch.managerId = :managerId', { managerId: filters.managerId });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('branch.isActive = :isActive', { isActive: filters.isActive });
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
   * Find branch by ID
   * @param id - Branch ID
   * @returns Branch entity
   */
  async findOne(id: string): Promise<InsuranceBranch> {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ['organization', 'manager', 'agents'],
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  /**
   * Find branch by code
   * @param branchCode - Branch code
   * @returns Branch entity
   */
  async findByCode(branchCode: string): Promise<InsuranceBranch> {
    const branch = await this.branchRepository.findOne({
      where: { branchCode },
      relations: ['organization', 'manager', 'agents'],
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  /**
   * Update branch
   * @param id - Branch ID
   * @param updateDto - Update data
   * @returns Updated branch
   */
  async update(id: string, updateDto: UpdateInsuranceBranchDto): Promise<InsuranceBranch> {
    const branch = await this.findOne(id);

    // Check if branch code is being changed and already exists
    if (updateDto.branchCode && updateDto.branchCode !== branch.branchCode) {
      const existing = await this.branchRepository.findOne({
        where: { branchCode: updateDto.branchCode },
      });

      if (existing) {
        throw new BadRequestException('Branch code already exists');
      }
    }

    Object.assign(branch, updateDto);
    return this.branchRepository.save(branch);
  }

  /**
   * Assign manager to branch
   * @param id - Branch ID
   * @param managerId - Manager user ID
   * @returns Updated branch
   */
  async assignManager(id: string, managerId: string): Promise<InsuranceBranch> {
    const branch = await this.findOne(id);
    branch.managerId = managerId;
    return this.branchRepository.save(branch);
  }

  /**
   * Update branch territories
   * @param id - Branch ID
   * @param territoryIds - Territory IDs
   * @returns Updated branch
   */
  async updateTerritories(id: string, territoryIds: string[]): Promise<InsuranceBranch> {
    const branch = await this.findOne(id);
    branch.territoryIds = territoryIds;
    return this.branchRepository.save(branch);
  }

  /**
   * Delete branch (soft delete)
   * @param id - Branch ID
   */
  async remove(id: string): Promise<void> {
    const branch = await this.findOne(id);
    branch.isActive = false;
    await this.branchRepository.save(branch);
  }

  /**
   * Get branches by agency
   * @param agencyId - Agency organization ID
   * @returns Branches under agency
   */
  async findByAgency(agencyId: string): Promise<InsuranceBranch[]> {
    // Get all child organizations of type branch
    const childOrgs = await this.organizationsService.getDescendants(agencyId);
    const branchOrgIds = childOrgs
      .filter((org) => org.type === OrganizationType.INSURANCE_BRANCH)
      .map((org) => org.id);

    if (branchOrgIds.length === 0) {
      return [];
    }

    return this.branchRepository.find({
      where: branchOrgIds.map((id) => ({ organizationId: id, isActive: true })),
      relations: ['organization', 'manager'],
    });
  }

  /**
   * Get branch statistics
   * @param id - Branch ID
   * @returns Branch statistics
   */
  async getBranchStatistics(id: string) {
    const branch = await this.findOne(id);

    const activeAgents = branch.agents?.filter((agent) => agent.isActive).length || 0;
    const totalAgents = branch.agents?.length || 0;

    return {
      branchId: branch.id,
      branchName: branch.branchName,
      totalAgents,
      activeAgents,
      inactiveAgents: totalAgents - activeAgents,
      territories: branch.territoryIds?.length || 0,
      serviceTypes: branch.serviceTypes,
    };
  }
}
