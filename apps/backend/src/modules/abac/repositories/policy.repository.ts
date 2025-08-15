import { Injectable } from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Policy } from '../entities/policy.entity';
import { PolicySet } from '../entities/policy-set.entity';

@Injectable()
export class PolicyRepository extends Repository<Policy> {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(PolicySet)
    private readonly policySetRepository: Repository<PolicySet>,
  ) {
    super(Policy, dataSource.createEntityManager());
  }

  async findPoliciesForEvaluation(
    organizationIds: string[],
    resource: string,
    action: string,
  ): Promise<Policy[]> {
    // Get all ancestor organizations for hierarchical policy inheritance
    const allOrganizationIds = new Set<string>(organizationIds);

    for (const orgId of organizationIds) {
      const ancestors = await this.dataSource
        .createQueryBuilder()
        .select('closure.ancestorId')
        .from('organizations_closure', 'closure')
        .where('closure.descendantId = :orgId', { orgId })
        .getRawMany();

      ancestors.forEach((a) => allOrganizationIds.add(a.ancestorId));
    }

    const queryBuilder = this.createQueryBuilder('policy')
      .leftJoinAndSelect('policy.policySet', 'policySet')
      .leftJoinAndSelect('policy.organization', 'organization')
      .where('policy.organizationId IN (:...organizationIds)', {
        organizationIds: Array.from(allOrganizationIds),
      })
      .andWhere('policy.isActive = :isActive', { isActive: true })
      .andWhere(
        '(policy.resource = :exactResource OR policy.resource = :wildcardResource OR policy.resource LIKE :resourcePattern)',
        {
          exactResource: resource,
          wildcardResource: '*',
          resourcePattern: `${resource.split(':')[0]}:%`,
        },
      )
      .andWhere('(policy.action = :exactAction OR policy.action = :wildcardAction)', {
        exactAction: action,
        wildcardAction: '*',
      })
      .orderBy('policy.priority', 'DESC')
      .addOrderBy('policySet.priority', 'DESC');

    return queryBuilder.getMany();
  }

  async findByPolicySet(policySetId: string): Promise<Policy[]> {
    return this.find({
      where: { policySetId },
      order: { priority: 'DESC' },
    });
  }

  async findByOrganization(organizationId: string, includeInherited = true): Promise<Policy[]> {
    if (!includeInherited) {
      return this.find({
        where: { organizationId },
        relations: ['policySet'],
        order: { priority: 'DESC' },
      });
    }

    // Get all ancestor organizations
    const organizationIds = await this.dataSource
      .createQueryBuilder()
      .select('closure.ancestorId')
      .from('organizations_closure', 'closure')
      .where('closure.descendantId = :organizationId', { organizationId })
      .getRawMany()
      .then((results) => results.map((r) => r.ancestorId));

    return this.find({
      where: { organizationId: In(organizationIds) },
      relations: ['policySet', 'organization'],
      order: { priority: 'DESC' },
    });
  }

  async createPolicySet(
    name: string,
    description: string,
    organizationId: string,
    priority = 50,
  ): Promise<PolicySet> {
    const policySet = this.policySetRepository.create({
      name,
      description,
      organizationId,
      isActive: true,
    });

    return this.policySetRepository.save(policySet);
  }

  async clonePolicy(
    policyId: string,
    targetOrganizationId: string,
    newName?: string,
  ): Promise<Policy> {
    const originalPolicy = await this.findOne({
      where: { id: policyId },
    });

    if (!originalPolicy) {
      throw new Error('Policy not found');
    }

    const clonedPolicy = this.create({
      ...originalPolicy,
      id: undefined,
      name: newName || `${originalPolicy.name} (Copy)`,
      organizationId: targetOrganizationId,
      createdAt: undefined,
      updatedAt: undefined,
    });

    return this.save(clonedPolicy);
  }

  async bulkUpdatePriorities(
    updates: Array<{ policyId: string; priority: number }>,
  ): Promise<void> {
    const promises = updates.map(({ policyId, priority }) => this.update(policyId, { priority }));

    await Promise.all(promises);
  }

  async searchPolicies(
    searchTerm: string,
    filters?: {
      organizationId?: string;
      effect?: 'allow' | 'deny';
      resource?: string;
      action?: string;
      status?: string;
    },
  ): Promise<Policy[]> {
    const queryBuilder = this.createQueryBuilder('policy')
      .leftJoinAndSelect('policy.policySet', 'policySet')
      .leftJoinAndSelect('policy.organization', 'organization');

    if (searchTerm) {
      queryBuilder.where('(policy.name ILIKE :search OR policy.description ILIKE :search)', {
        search: `%${searchTerm}%`,
      });
    }

    if (filters?.organizationId) {
      queryBuilder.andWhere('policy.organizationId = :organizationId', {
        organizationId: filters.organizationId,
      });
    }

    if (filters?.effect) {
      queryBuilder.andWhere('policy.effect = :effect', {
        effect: filters.effect,
      });
    }

    if (filters?.resource) {
      queryBuilder.andWhere('policy.resource LIKE :resource', {
        resource: `%${filters.resource}%`,
      });
    }

    if (filters?.action) {
      queryBuilder.andWhere('policy.action LIKE :action', {
        action: `%${filters.action}%`,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('policy.status = :status', {
        status: filters.status,
      });
    }

    return queryBuilder.orderBy('policy.priority', 'DESC').getMany();
  }

  async getPolicyStats(organizationId?: string): Promise<{
    totalPolicies: number;
    allowPolicies: number;
    denyPolicies: number;
    activePolicies: number;
    policiesByResource: Record<string, number>;
  }> {
    let queryBuilder = this.createQueryBuilder('policy');

    if (organizationId) {
      const organizationIds = await this.dataSource
        .createQueryBuilder()
        .select('closure.ancestorId')
        .from('organizations_closure', 'closure')
        .where('closure.descendantId = :organizationId', { organizationId })
        .getRawMany()
        .then((results) => results.map((r) => r.ancestorId));

      queryBuilder = queryBuilder.where('policy.organizationId IN (:...organizationIds)', {
        organizationIds,
      });
    }

    const policies = await queryBuilder.getMany();

    const stats = {
      totalPolicies: policies.length,
      allowPolicies: policies.filter((p) => p.effect === 'allow').length,
      denyPolicies: policies.filter((p) => p.effect === 'deny').length,
      activePolicies: policies.filter((p) => p.isActive).length,
      policiesByResource: {} as Record<string, number>,
    };

    policies.forEach((policy) => {
      const resourceType = policy.resources?.types?.[0] || 'unknown';
      stats.policiesByResource[resourceType] = (stats.policiesByResource[resourceType] || 0) + 1;
    });

    return stats;
  }

  async validatePolicyConflicts(
    policy: Partial<Policy>,
    organizationId: string,
  ): Promise<{
    hasConflicts: boolean;
    conflicts: Policy[];
  }> {
    const potentialConflicts = await this.createQueryBuilder('policy')
      .where('policy.organizationId = :organizationId', { organizationId })
      .andWhere('policy.resources @> :resources', {
        resources: JSON.stringify(policy.resources || {}),
      })
      .andWhere('policy.actions @> :actions', { actions: policy.actions || [] })
      .andWhere('policy.effect != :effect', { effect: policy.effect })
      .andWhere('policy.isActive = :isActive', { isActive: true })
      .getMany();

    return {
      hasConflicts: potentialConflicts.length > 0,
      conflicts: potentialConflicts,
    };
  }
}
