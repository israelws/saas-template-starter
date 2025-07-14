import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Policy } from '../entities/policy.entity';
import { PolicySet } from '../entities/policy-set.entity';
import {
  CreatePolicyDto,
  UpdatePolicyDto,
  PaginationParams,
  PaginatedResponse,
  DEFAULT_POLICY_PRIORITY,
} from '@saas-template/shared';

@Injectable()
export class PolicyService {
  constructor(
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(PolicySet)
    private readonly policySetRepository: Repository<PolicySet>,
  ) {}

  async create(createPolicyDto: CreatePolicyDto): Promise<Policy> {
    // Validate policy structure
    this.validatePolicy(createPolicyDto);

    const policy = this.policyRepository.create({
      ...createPolicyDto,
      priority: createPolicyDto.priority ?? DEFAULT_POLICY_PRIORITY,
      version: 1,
    });

    return this.policyRepository.save(policy);
  }

  async findAll(
    organizationId: string,
    params: PaginationParams,
  ): Promise<PaginatedResponse<Policy>> {
    const { page, limit, sortBy = 'priority', sortOrder = 'ASC' } = params;

    // Ensure page and limit are numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const [policies, total] = await this.policyRepository.findAndCount({
      where: { organizationId },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      order: { [sortBy]: sortOrder },
      relations: ['organization', 'policySet'],
    });

    return {
      data: policies,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findOne(id: string): Promise<Policy> {
    const policy = await this.policyRepository.findOne({
      where: { id },
      relations: ['organization', 'policySet'],
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    return policy;
  }

  async findByOrganization(organizationId: string): Promise<Policy[]> {
    return this.policyRepository.find({
      where: { organizationId, isActive: true },
      order: { priority: 'ASC' },
    });
  }

  async findApplicablePolicies(
    organizationId: string,
    resourceType: string,
  ): Promise<Policy[]> {
    // Get all active policies for the organization
    const policies = await this.policyRepository
      .createQueryBuilder('policy')
      .where('policy.organizationId = :organizationId', { organizationId })
      .andWhere('policy.isActive = :isActive', { isActive: true })
      .andWhere(
        `(
          policy.resources->'types' @> :resourceType OR
          policy.resources->'types' @> '"*"' OR
          policy.resources->'types' IS NULL
        )`,
        { resourceType: JSON.stringify([resourceType]) },
      )
      .orderBy('policy.priority', 'ASC')
      .addOrderBy('policy.effect', 'DESC') // DENY policies first
      .getMany();

    return policies;
  }

  async update(id: string, updatePolicyDto: UpdatePolicyDto): Promise<Policy> {
    const policy = await this.findOne(id);

    // Validate update
    if (updatePolicyDto.effect || updatePolicyDto.subjects || updatePolicyDto.resources) {
      this.validatePolicy({ ...policy, ...updatePolicyDto });
    }

    // Increment version on significant changes
    const significantChange = 
      updatePolicyDto.effect !== undefined ||
      updatePolicyDto.subjects !== undefined ||
      updatePolicyDto.resources !== undefined ||
      updatePolicyDto.actions !== undefined ||
      updatePolicyDto.conditions !== undefined;

    if (significantChange) {
      policy.version += 1;
    }

    Object.assign(policy, updatePolicyDto);
    policy.updatedAt = new Date();

    return this.policyRepository.save(policy);
  }

  async remove(id: string): Promise<void> {
    const policy = await this.findOne(id);
    
    // Soft delete by setting isActive to false
    policy.isActive = false;
    await this.policyRepository.save(policy);
  }

  async clone(id: string, name: string): Promise<Policy> {
    const originalPolicy = await this.findOne(id);
    
    const clonedPolicy = this.policyRepository.create({
      ...originalPolicy,
      id: undefined,
      name,
      version: 1,
      createdAt: undefined,
      updatedAt: undefined,
    });

    return this.policyRepository.save(clonedPolicy);
  }

  async testPolicy(
    policyId: string,
    context: any, // PolicyEvaluationContext
  ): Promise<{ matches: boolean; reason: string }> {
    const policy = await this.findOne(policyId);
    
    // This would use the PolicyEvaluatorService to test a single policy
    // For now, return a simple response
    return {
      matches: true,
      reason: 'Policy test not yet implemented',
    };
  }

  // PolicySet methods
  async createPolicySet(
    name: string,
    description: string,
    organizationId: string,
  ): Promise<PolicySet> {
    const policySet = this.policySetRepository.create({
      name,
      description,
      organizationId,
    });

    return this.policySetRepository.save(policySet);
  }

  async findPolicySets(organizationId: string): Promise<PolicySet[]> {
    return this.policySetRepository.find({
      where: { organizationId },
      relations: ['policies'],
    });
  }

  async addPolicyToSet(policyId: string, policySetId: string): Promise<Policy> {
    const policy = await this.findOne(policyId);
    const policySet = await this.policySetRepository.findOne({
      where: { id: policySetId },
    });

    if (!policySet) {
      throw new NotFoundException('PolicySet not found');
    }

    policy.policySet = policySet;
    return this.policyRepository.save(policy);
  }

  async removePolicyFromSet(policyId: string): Promise<Policy> {
    const policy = await this.findOne(policyId);
    policy.policySet = null;
    return this.policyRepository.save(policy);
  }

  // Validation
  private validatePolicy(policy: Partial<Policy> | CreatePolicyDto): void {
    // Validate that at least one subject criterion is specified
    if (!policy.subjects || Object.keys(policy.subjects).length === 0) {
      throw new BadRequestException('At least one subject criterion must be specified');
    }

    // Validate that at least one resource criterion is specified
    if (!policy.resources || Object.keys(policy.resources).length === 0) {
      throw new BadRequestException('At least one resource criterion must be specified');
    }

    // Validate that at least one action is specified
    if (!policy.actions || policy.actions.length === 0) {
      throw new BadRequestException('At least one action must be specified');
    }

    // Validate priority range
    if (policy.priority !== undefined && (policy.priority < 0 || policy.priority > 1000)) {
      throw new BadRequestException('Priority must be between 0 and 1000');
    }
  }
}