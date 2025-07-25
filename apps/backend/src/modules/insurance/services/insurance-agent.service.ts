import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InsuranceAgent } from '../entities/insurance-agent.entity';
import { 
  CreateInsuranceAgentDto, 
  UpdateInsuranceAgentDto,
  PaginationParams,
  LicenseStatus,
} from '@saas-template/shared';

/**
 * Service for managing insurance agents
 * @class InsuranceAgentService
 * @injectable
 */
@Injectable()
export class InsuranceAgentService {
  constructor(
    @InjectRepository(InsuranceAgent)
    private agentRepository: Repository<InsuranceAgent>,
  ) {}

  /**
   * Create a new insurance agent
   * @param createDto - Agent creation data
   * @returns Created agent
   */
  async create(createDto: CreateInsuranceAgentDto): Promise<InsuranceAgent> {
    // Check if agent code already exists
    const existing = await this.agentRepository.findOne({
      where: { agentCode: createDto.agentCode },
    });
    
    if (existing) {
      throw new BadRequestException('Agent code already exists');
    }

    const agent = this.agentRepository.create({
      ...createDto,
      licenseStatus: LicenseStatus.PENDING,
      performanceMetrics: {
        totalPoliciesSold: 0,
        totalPremiumVolume: 0,
        averagePolicyValue: 0,
        customerRetentionRate: 0,
        lastUpdated: new Date(),
      },
    });

    return this.agentRepository.save(agent);
  }

  /**
   * Find all agents with pagination
   * @param params - Pagination parameters
   * @param filters - Optional filters
   * @returns Paginated agents
   */
  async findAll(
    params: PaginationParams,
    filters?: {
      branchId?: string;
      licenseStatus?: LicenseStatus;
      isActive?: boolean;
    },
  ) {
    const query = this.agentRepository.createQueryBuilder('agent')
      .leftJoinAndSelect('agent.user', 'user')
      .leftJoinAndSelect('agent.branch', 'branch');

    if (filters?.branchId) {
      query.andWhere('agent.branchId = :branchId', { branchId: filters.branchId });
    }

    if (filters?.licenseStatus) {
      query.andWhere('agent.licenseStatus = :status', { status: filters.licenseStatus });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('agent.isActive = :isActive', { isActive: filters.isActive });
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
   * Find agent by ID
   * @param id - Agent ID
   * @returns Agent entity
   */
  async findOne(id: string): Promise<InsuranceAgent> {
    const agent = await this.agentRepository.findOne({
      where: { id },
      relations: ['user', 'branch'],
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  /**
   * Find agent by user ID
   * @param userId - User ID
   * @returns Agent entity
   */
  async findByUserId(userId: string): Promise<InsuranceAgent> {
    const agent = await this.agentRepository.findOne({
      where: { userId },
      relations: ['user', 'branch'],
    });

    if (!agent) {
      throw new NotFoundException('Agent not found for this user');
    }

    return agent;
  }

  /**
   * Update agent
   * @param id - Agent ID
   * @param updateDto - Update data
   * @returns Updated agent
   */
  async update(id: string, updateDto: UpdateInsuranceAgentDto): Promise<InsuranceAgent> {
    const agent = await this.findOne(id);

    // Check if agent code is being changed and already exists
    if (updateDto.agentCode && updateDto.agentCode !== agent.agentCode) {
      const existing = await this.agentRepository.findOne({
        where: { agentCode: updateDto.agentCode },
      });
      
      if (existing) {
        throw new BadRequestException('Agent code already exists');
      }
    }

    Object.assign(agent, updateDto);
    return this.agentRepository.save(agent);
  }

  /**
   * Update agent license status
   * @param id - Agent ID
   * @param status - New license status
   * @returns Updated agent
   */
  async updateLicenseStatus(id: string, status: LicenseStatus): Promise<InsuranceAgent> {
    const agent = await this.findOne(id);
    agent.licenseStatus = status;
    return this.agentRepository.save(agent);
  }

  /**
   * Update agent performance metrics
   * @param id - Agent ID
   * @param metrics - Performance metrics
   * @returns Updated agent
   */
  async updatePerformanceMetrics(
    id: string,
    metrics: Partial<InsuranceAgent['performanceMetrics']>,
  ): Promise<InsuranceAgent> {
    const agent = await this.findOne(id);
    
    agent.performanceMetrics = {
      ...agent.performanceMetrics,
      ...metrics,
      lastUpdated: new Date(),
    };
    
    return this.agentRepository.save(agent);
  }

  /**
   * Assign territories to agent
   * @param id - Agent ID
   * @param territoryIds - Territory IDs
   * @returns Updated agent
   */
  async assignTerritories(id: string, territoryIds: string[]): Promise<InsuranceAgent> {
    const agent = await this.findOne(id);
    agent.territoryIds = territoryIds;
    return this.agentRepository.save(agent);
  }

  /**
   * Delete agent (soft delete)
   * @param id - Agent ID
   */
  async remove(id: string): Promise<void> {
    const agent = await this.findOne(id);
    agent.isActive = false;
    await this.agentRepository.save(agent);
  }

  /**
   * Get agents by branch
   * @param branchId - Branch ID
   * @returns Agents in branch
   */
  async findByBranch(branchId: string): Promise<InsuranceAgent[]> {
    return this.agentRepository.find({
      where: { branchId, isActive: true },
      relations: ['user'],
    });
  }

  /**
   * Check license expiry
   * @returns Agents with expired or expiring licenses
   */
  async checkLicenseExpiry(): Promise<InsuranceAgent[]> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return this.agentRepository
      .createQueryBuilder('agent')
      .where('agent.licenseExpiryDate < :date', { date: thirtyDaysFromNow })
      .andWhere('agent.licenseStatus = :status', { status: LicenseStatus.ACTIVE })
      .andWhere('agent.isActive = true')
      .getMany();
  }
}