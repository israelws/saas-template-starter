import { Injectable } from '@nestjs/common';
import { DataSource, Repository, TreeRepository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from '../entities/organization.entity';

@Injectable()
export class OrganizationRepository extends TreeRepository<Organization> {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {
    super(Organization, dataSource.createEntityManager());
  }

  async findWithChildren(organizationId: string): Promise<Organization> {
    const organization = await this.findOne({
      where: { id: organizationId },
      relations: ['children'],
    });

    if (!organization) {
      return null;
    }

    // Recursively load all children
    await this.loadDescendants(organization);
    return organization;
  }

  async findWithParents(organizationId: string): Promise<Organization> {
    const organization = await this.findOne({
      where: { id: organizationId },
      relations: ['parent'],
    });

    if (!organization) {
      return null;
    }

    // Load all ancestors
    await this.loadAncestors(organization);
    return organization;
  }

  async findAllDescendants(organizationId: string): Promise<Organization[]> {
    const queryBuilder = this.createQueryBuilder('org')
      .innerJoin('organizations_closure', 'closure', 'closure.descendantId = org.id')
      .where('closure.ancestorId = :organizationId', { organizationId })
      .andWhere('closure.descendantId != :organizationId', { organizationId });

    return queryBuilder.getMany();
  }

  async findAllAncestors(organizationId: string): Promise<Organization[]> {
    const queryBuilder = this.createQueryBuilder('org')
      .innerJoin('organizations_closure', 'closure', 'closure.ancestorId = org.id')
      .where('closure.descendantId = :organizationId', { organizationId })
      .andWhere('closure.ancestorId != :organizationId', { organizationId })
      .orderBy('closure.depth', 'DESC');

    return queryBuilder.getMany();
  }

  async findByPath(path: string[]): Promise<Organization | null> {
    if (path.length === 0) {
      return null;
    }

    // For tree entities, parent null check is done differently
    const roots = await this.findRoots();
    let current: Organization | null = roots.find((org) => org.code === path[0]) || null;

    for (let i = 1; i < path.length && current; i++) {
      // Find child with matching code
      const children = await this.findDescendants(current);
      current =
        children.find((child) => child.code === path[i] && child.parent?.id === current?.id) ||
        null;
    }

    return current;
  }

  async getOrganizationDepth(organizationId: string): Promise<number> {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('MAX(closure.depth)', 'maxDepth')
      .from('organizations_closure', 'closure')
      .where('closure.descendantId = :organizationId', { organizationId })
      .andWhere('closure.ancestorId != :organizationId', { organizationId })
      .getRawOne();

    return result?.maxDepth || 0;
  }

  async moveOrganization(organizationId: string, newParentId: string | null): Promise<void> {
    const organization = await this.findOne({
      where: { id: organizationId },
      relations: ['parent'],
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    if (newParentId) {
      const newParent = await this.findOne({
        where: { id: newParentId },
      });

      if (!newParent) {
        throw new Error('New parent organization not found');
      }

      // Check for circular reference
      const ancestors = await this.findAllAncestors(newParentId);
      if (ancestors.some((a) => a.id === organizationId)) {
        throw new Error('Cannot move organization to its own descendant');
      }

      organization.parent = newParent;
    } else {
      organization.parent = null;
    }

    await this.save(organization);
  }

  async getOrganizationStats(organizationId: string): Promise<{
    totalDescendants: number;
    totalUsers: number;
    totalPolicies: number;
    depth: number;
  }> {
    const descendants = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('organizations_closure', 'closure')
      .where('closure.ancestorId = :organizationId', { organizationId })
      .andWhere('closure.descendantId != :organizationId', { organizationId })
      .getRawOne()
      .then((result) => parseInt(result?.count || '0'));

    const users = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(DISTINCT uom.userId)', 'count')
      .from('user_organization_memberships', 'uom')
      .innerJoin('organizations_closure', 'closure', 'closure.descendantId = uom.organizationId')
      .where('closure.ancestorId = :organizationId', { organizationId })
      .getRawOne();

    const policies = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(DISTINCT p.id)', 'count')
      .from('policies', 'p')
      .innerJoin('organizations_closure', 'closure', 'closure.descendantId = p.organizationId')
      .where('closure.ancestorId = :organizationId', { organizationId })
      .getRawOne();

    const depth = await this.getOrganizationDepth(organizationId);

    return {
      totalDescendants: descendants,
      totalUsers: parseInt(users?.count || '0'),
      totalPolicies: parseInt(policies?.count || '0'),
      depth,
    };
  }

  async searchOrganizations(
    searchTerm: string,
    filters?: {
      type?: string;
      status?: string;
      parentId?: string;
    },
  ): Promise<Organization[]> {
    const queryBuilder = this.createQueryBuilder('org');

    if (searchTerm) {
      queryBuilder.where(
        '(org.name ILIKE :search OR org.code ILIKE :search OR org.description ILIKE :search)',
        { search: `%${searchTerm}%` },
      );
    }

    if (filters?.type) {
      queryBuilder.andWhere('org.type = :type', { type: filters.type });
    }

    if (filters?.status) {
      queryBuilder.andWhere('org.status = :status', { status: filters.status });
    }

    if (filters?.parentId) {
      queryBuilder.andWhere('org.parentId = :parentId', {
        parentId: filters.parentId,
      });
    }

    return queryBuilder.orderBy('org.name', 'ASC').getMany();
  }

  private async loadDescendants(organization: Organization): Promise<void> {
    if (organization.children && organization.children.length > 0) {
      for (const child of organization.children) {
        const fullChild = await this.findOne({
          where: { id: child.id },
          relations: ['children'],
        });
        if (fullChild) {
          child.children = fullChild.children;
          await this.loadDescendants(child);
        }
      }
    }
  }

  private async loadAncestors(organization: Organization): Promise<void> {
    if (organization.parent) {
      const parent = await this.findOne({
        where: { id: organization.parent.id },
        relations: ['parent'],
      });
      if (parent) {
        organization.parent = parent;
        await this.loadAncestors(parent);
      }
    }
  }
}
