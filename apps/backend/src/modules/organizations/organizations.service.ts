import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository, IsNull } from 'typeorm';
import { Organization } from './entities/organization.entity';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  PaginationParams,
  PaginatedResponse,
  OrganizationType,
  OrganizationHierarchy,
  ORGANIZATION_TYPE_HIERARCHY,
} from '@saas-template/shared';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: TreeRepository<Organization>,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    // Validate parent-child relationship if parent is provided
    if (createOrganizationDto.parentId) {
      const parent = await this.findOne(createOrganizationDto.parentId);
      
      // Check if the parent type can have this child type
      const allowedChildTypes = ORGANIZATION_TYPE_HIERARCHY[parent.type];
      if (!allowedChildTypes.includes(createOrganizationDto.type)) {
        throw new BadRequestException(
          `Organization of type ${parent.type} cannot have children of type ${createOrganizationDto.type}`,
        );
      }
    }

    const organization = this.organizationRepository.create({
      ...createOrganizationDto,
      settings: {
        allowSubOrganizations: true,
        maxDepth: 4,
        features: ['basic'],
        ...createOrganizationDto.settings,
      },
    });

    if (createOrganizationDto.parentId) {
      const parent = await this.findOne(createOrganizationDto.parentId);
      organization.parent = parent;
    }

    const savedOrg = await this.organizationRepository.save(organization);

    // Update materialized path
    await this.updateMaterializedPath(savedOrg);

    return savedOrg;
  }

  async findAll(params: PaginationParams): Promise<PaginatedResponse<Organization>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'DESC' } = params;

    const [organizations, total] = await this.organizationRepository.findAndCount({
      where: { parent: IsNull() }, // Only get root organizations
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortBy]: sortOrder },
      relations: ['children'],
    });

    return {
      data: organizations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async findWithFullHierarchy(id: string): Promise<Organization> {
    const organization = await this.findOne(id);
    
    // Get all descendants
    const descendants = await this.organizationRepository.findDescendants(organization);
    organization.children = this.buildTree(descendants, organization.id);

    return organization;
  }

  async getHierarchy(rootId?: string): Promise<OrganizationHierarchy[]> {
    let roots: Organization[];

    if (rootId) {
      const root = await this.findOne(rootId);
      roots = [root];
    } else {
      roots = await this.organizationRepository.find({
        where: { parent: IsNull() },
      });
    }

    const hierarchies: OrganizationHierarchy[] = [];

    for (const root of roots) {
      const tree = await this.organizationRepository.findDescendantsTree(root);
      hierarchies.push(this.mapToHierarchy(tree));
    }

    return hierarchies;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.findOne(id);

    // Don't allow changing parent through update
    const { parentId, ...updateData } = updateOrganizationDto;

    Object.assign(organization, updateData);
    organization.updatedAt = new Date();

    return this.organizationRepository.save(organization);
  }

  async move(id: string, newParentId: string | null): Promise<Organization> {
    const organization = await this.findOne(id);
    
    if (newParentId) {
      const newParent = await this.findOne(newParentId);
      
      // Validate the move
      if (await this.isDescendantOf(newParent, organization)) {
        throw new BadRequestException('Cannot move organization to its own descendant');
      }

      // Check if the parent type can have this child type
      const allowedChildTypes = ORGANIZATION_TYPE_HIERARCHY[newParent.type];
      if (!allowedChildTypes.includes(organization.type)) {
        throw new BadRequestException(
          `Organization of type ${newParent.type} cannot have children of type ${organization.type}`,
        );
      }

      organization.parent = newParent;
    } else {
      organization.parent = null;
    }

    const savedOrg = await this.organizationRepository.save(organization);
    
    // Update materialized paths for the moved subtree
    await this.updateMaterializedPathForSubtree(savedOrg);

    return savedOrg;
  }

  async remove(id: string): Promise<void> {
    const organization = await this.findOne(id);
    
    // Check if organization has children
    const childrenCount = await this.organizationRepository.countBy({
      parent: { id },
    });

    if (childrenCount > 0) {
      throw new BadRequestException('Cannot delete organization with children');
    }

    // Instead of hard delete, soft delete by setting isActive to false
    organization.isActive = false;
    await this.organizationRepository.save(organization);
  }

  async getAncestors(id: string): Promise<Organization[]> {
    const organization = await this.findOne(id);
    return this.organizationRepository.findAncestors(organization);
  }

  async getDescendants(id: string): Promise<Organization[]> {
    const organization = await this.findOne(id);
    return this.organizationRepository.findDescendants(organization);
  }

  // Helper methods
  private buildTree(organizations: Organization[], parentId: string): Organization[] {
    const children = organizations.filter(org => org.parent?.id === parentId);
    
    return children.map(child => ({
      ...child,
      children: this.buildTree(organizations, child.id),
    }));
  }

  private mapToHierarchy(organization: Organization): OrganizationHierarchy {
    return {
      id: organization.id,
      name: organization.name,
      type: organization.type,
      children: organization.children?.map(child => this.mapToHierarchy(child)) || [],
    };
  }

  private async isDescendantOf(
    possibleDescendant: Organization,
    possibleAncestor: Organization,
  ): Promise<boolean> {
    const ancestors = await this.organizationRepository.findAncestors(possibleDescendant);
    return ancestors.some(ancestor => ancestor.id === possibleAncestor.id);
  }

  private async updateMaterializedPath(organization: Organization): Promise<void> {
    const ancestors = await this.organizationRepository.findAncestors(organization);
    const path = ancestors
      .reverse()
      .map(ancestor => ancestor.id)
      .join('.');
    
    organization.path = path;
    await this.organizationRepository.save(organization);
  }

  private async updateMaterializedPathForSubtree(organization: Organization): Promise<void> {
    const descendants = await this.organizationRepository.findDescendants(organization);
    
    for (const descendant of descendants) {
      await this.updateMaterializedPath(descendant);
    }
  }
}