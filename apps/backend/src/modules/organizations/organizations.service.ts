import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository, IsNull, DataSource, QueryRunner } from 'typeorm';
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

/**
 * Service for managing organizations with hierarchical structure
 * @class OrganizationsService
 * @description
 * Handles all organization-related operations including CRUD, hierarchy management,
 * and parent-child relationship validation. Implements business rules for organization
 * type constraints.
 */
@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: TreeRepository<Organization>,
    private readonly dataSource: DataSource,
    // @Inject(forwardRef(() => 'EventsGateway'))
    // private readonly eventsGateway?: any,
  ) {}

  /**
   * Creates a new organization with parent validation
   * @method create
   * @async
   * @param {CreateOrganizationDto} createOrganizationDto - Organization data
   * @returns {Promise<Organization>} Created organization
   * @throws {BadRequestException} If parent-child type constraint is violated
   * @description
   * Validates parent-child relationships based on organization type:
   * - Division can only have company as parent
   * - Department can only have division as parent
   * - Team can only have department as parent
   * - Insurance agency can only have company as parent
   * - Insurance branch can only have insurance agency as parent
   */
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

    // TODO: Emit real-time event when EventsGateway is implemented
    // if (this.eventsGateway) {
    //   this.eventsGateway.broadcastOrganizationEvent(
    //     savedOrg.id,
    //     'organization_created',
    //     {
    //       organization: savedOrg,
    //       parentId: savedOrg.parent?.id,
    //     }
    //   );

    //   // Also emit to parent organization if exists
    //   if (savedOrg.parent) {
    //     this.eventsGateway.broadcastHierarchyEvent(
    //       savedOrg.parent.id,
    //       'child_organization_added',
    //       {
    //         newChild: savedOrg,
    //         parentId: savedOrg.parent.id,
    //       }
    //     );
    //   }
    // }

    return savedOrg;
  }

  /**
   * Retrieves all organizations with pagination and parent relationships
   * @method findAll
   * @async
   * @param {PaginationParams} params - Pagination parameters
   * @returns {Promise<PaginatedResponse<Organization>>} Paginated organizations with parentId
   * @description
   * Returns organizations with their parent relationships included. The parentId
   * is extracted from the closure table to support the frontend tree view.
   * Results include both parentId and parent object references.
   */
  /**
   * Searches organizations by name with autocomplete support
   * @method searchByName
   * @async
   * @param {string} name - Partial organization name (min 3 chars)
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Organization[]>} Matching organizations
   * @description
   * Case-insensitive search that matches organizations starting with
   * or containing the search query. Results include parent relationships.
   */
  async searchByName(name: string, limit: number = 10): Promise<Organization[]> {
    const searchQuery = `%${name}%`;

    const organizations = await this.organizationRepository
      .createQueryBuilder('org')
      .leftJoinAndSelect('org.parent', 'parent')
      .where('LOWER(org.name) LIKE LOWER(:search)', { search: searchQuery })
      .orWhere('LOWER(org.code) LIKE LOWER(:search)', { search: searchQuery })
      .orderBy('org.name', 'ASC')
      .limit(limit)
      .getMany();

    // Add parentId to each organization
    return organizations;
  }

  async findAll(params: PaginationParams): Promise<PaginatedResponse<Organization>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'DESC' } = params;

    // Ensure page and limit are numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    // Use raw query to get organizations with parentId from closure table
    const query = `
      SELECT 
        o.*,
        p.id as parent_id,
        p.name as parent_name,
        p.type as parent_type
      FROM organizations o
      LEFT JOIN LATERAL (
        SELECT c.id_ancestor as id
        FROM organizations_closure c
        WHERE c.id_descendant = o.id 
          AND c.id_ancestor != c.id_descendant
          AND NOT EXISTS (
            SELECT 1 
            FROM organizations_closure c2 
            WHERE c2.id_descendant = o.id 
              AND c2.id_ancestor != o.id 
              AND c2.id_ancestor != c.id_ancestor
              AND EXISTS (
                SELECT 1 
                FROM organizations_closure c3 
                WHERE c3.id_descendant = c2.id_ancestor 
                  AND c3.id_ancestor = c.id_ancestor
              )
          )
        LIMIT 1
      ) AS parent_rel ON true
      LEFT JOIN organizations p ON parent_rel.id = p.id
      ORDER BY o."${sortBy}" ${sortOrder}
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `SELECT COUNT(*) FROM organizations`;

    const [organizations, countResult] = await Promise.all([
      this.organizationRepository.query(query, [limitNum, (pageNum - 1) * limitNum]),
      this.organizationRepository.query(countQuery),
    ]);

    const total = parseInt(countResult[0].count, 10);

    // Transform raw results to Organization entities with parentId
    const organizationsWithParentId = organizations.map((row) => {
      const org = this.organizationRepository.create({
        id: row.id,
        name: row.name,
        type: row.type,
        description: row.description,
        code: row.code,
        settings: row.settings,
        metadata: row.metadata,
        isActive: row.isActive,
        path: row.path,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        parentId: row.parent_id || null,
      });

      // Add parent object if exists
      if (row.parent_id) {
        org.parent = {
          id: row.parent_id,
          name: row.parent_name,
          type: row.parent_type,
        } as Organization;
      }

      return org;
    });

    return {
      data: organizationsWithParentId,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
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

  /**
   * Gets the complete organization hierarchy as a tree structure
   * @method getHierarchy
   * @async
   * @param {string} [rootId] - Optional root organization ID
   * @returns {Promise<OrganizationHierarchy[]>} Array of organization trees
   * @description
   * Returns organizations structured as a hierarchy. If rootId is provided,
   * returns only that subtree. Otherwise returns all root organizations
   * with their complete descendant trees.
   */
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

  /**
   * Moves an organization to a new parent
   * @method move
   * @async
   * @param {string} id - Organization ID to move
   * @param {string | null} newParentId - New parent ID or null for root
   * @returns {Promise<Organization>} Updated organization
   * @throws {BadRequestException} If move violates constraints or creates circular reference
   * @description
   * Validates the move operation to ensure:
   * - No circular references (can't move to own descendant)
   * - Parent-child type constraints are maintained
   * - Updates materialized paths for the entire subtree
   */
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

  /**
   * Builds a tree structure from flat organization array
   * @method buildTree
   * @private
   * @param {Organization[]} organizations - Flat array of organizations
   * @param {string} parentId - Parent ID to build tree from
   * @returns {Organization[]} Array of child organizations with nested children
   */
  private buildTree(organizations: Organization[], parentId: string): Organization[] {
    const children = organizations.filter((org) => org.parent?.id === parentId);

    return children.map((child) => {
      // Set children on the existing entity instance
      child.children = this.buildTree(organizations, child.id);
      return child;
    });
  }

  /**
   * Maps an organization entity to hierarchy DTO
   * @method mapToHierarchy
   * @private
   * @param {Organization} organization - Organization entity
   * @returns {OrganizationHierarchy} Hierarchy DTO
   */
  private mapToHierarchy(organization: Organization): OrganizationHierarchy {
    return {
      id: organization.id,
      name: organization.name,
      type: organization.type,
      children: organization.children?.map((child) => this.mapToHierarchy(child)) || [],
    };
  }

  private async isDescendantOf(
    possibleDescendant: Organization,
    possibleAncestor: Organization,
  ): Promise<boolean> {
    const ancestors = await this.organizationRepository.findAncestors(possibleDescendant);
    return ancestors.some((ancestor) => ancestor.id === possibleAncestor.id);
  }

  private async updateMaterializedPath(organization: Organization): Promise<void> {
    const ancestors = await this.organizationRepository.findAncestors(organization);
    const path = ancestors
      .reverse()
      .map((ancestor) => ancestor.id)
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

  // Bulk Operations
  async bulkCreate(createDtos: CreateOrganizationDto[]): Promise<{
    successful: Organization[];
    failed: Array<{ dto: CreateOrganizationDto; error: string }>;
  }> {
    const successful: Organization[] = [];
    const failed: Array<{ dto: CreateOrganizationDto; error: string }> = [];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const dto of createDtos) {
        try {
          // Validate parent-child relationship if parent is provided
          if (dto.parentId) {
            const parent = await queryRunner.manager.findOne(Organization, {
              where: { id: dto.parentId },
            });

            if (!parent) {
              throw new Error('Parent organization not found');
            }

            const allowedChildTypes = ORGANIZATION_TYPE_HIERARCHY[parent.type];
            if (!allowedChildTypes.includes(dto.type)) {
              throw new Error(
                `Organization of type ${parent.type} cannot have children of type ${dto.type}`,
              );
            }
          }

          const organization = queryRunner.manager.create(Organization, {
            ...dto,
            settings: {
              allowSubOrganizations: true,
              maxDepth: 4,
              features: ['basic'],
              ...dto.settings,
            },
          });

          if (dto.parentId) {
            const parent = await queryRunner.manager.findOne(Organization, {
              where: { id: dto.parentId },
            });
            organization.parent = parent;
          }

          const saved = await queryRunner.manager.save(organization);
          successful.push(saved);
        } catch (error) {
          failed.push({ dto, error: error.message });
        }
      }

      await queryRunner.commitTransaction();
      return { successful, failed };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkUpdate(updates: Array<{ id: string; data: UpdateOrganizationDto }>): Promise<{
    successful: Organization[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const successful: Organization[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const update of updates) {
        try {
          const organization = await queryRunner.manager.findOne(Organization, {
            where: { id: update.id },
          });

          if (!organization) {
            throw new Error('Organization not found');
          }

          Object.assign(organization, update.data);
          const saved = await queryRunner.manager.save(organization);
          successful.push(saved);
        } catch (error) {
          failed.push({ id: update.id, error: error.message });
        }
      }

      await queryRunner.commitTransaction();
      return { successful, failed };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkMove(moves: Array<{ organizationId: string; newParentId: string | null }>): Promise<{
    successful: Array<{ organizationId: string; message: string }>;
    failed: Array<{ organizationId: string; error: string }>;
  }> {
    const successful: Array<{ organizationId: string; message: string }> = [];
    const failed: Array<{ organizationId: string; error: string }> = [];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const move of moves) {
        try {
          const organization = await queryRunner.manager.findOne(Organization, {
            where: { id: move.organizationId },
            relations: ['parent'],
          });

          if (!organization) {
            throw new Error('Organization not found');
          }

          if (move.newParentId) {
            const newParent = await queryRunner.manager.findOne(Organization, {
              where: { id: move.newParentId },
            });

            if (!newParent) {
              throw new Error('New parent organization not found');
            }

            // Check for circular reference
            const ancestors = await this.organizationRepository.findAncestors(newParent);
            if (ancestors.some((a) => a.id === move.organizationId)) {
              throw new Error('Cannot move organization to its own descendant');
            }

            // Validate parent-child relationship
            const allowedChildTypes = ORGANIZATION_TYPE_HIERARCHY[newParent.type];
            if (!allowedChildTypes.includes(organization.type)) {
              throw new Error(
                `Organization of type ${newParent.type} cannot have children of type ${organization.type}`,
              );
            }

            organization.parent = newParent;
          } else {
            organization.parent = null;
          }

          await queryRunner.manager.save(organization);
          successful.push({
            organizationId: move.organizationId,
            message: 'Organization moved successfully',
          });
        } catch (error) {
          failed.push({ organizationId: move.organizationId, error: error.message });
        }
      }

      await queryRunner.commitTransaction();
      return { successful, failed };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkArchive(
    organizationIds: string[],
    archiveChildren = false,
  ): Promise<{
    archived: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const archived: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const id of organizationIds) {
        try {
          const organization = await queryRunner.manager.findOne(Organization, {
            where: { id },
          });

          if (!organization) {
            throw new Error('Organization not found');
          }

          if (!archiveChildren) {
            // Check if organization has active children
            const activeChildrenCount = await queryRunner.manager.count(Organization, {
              where: { parent: { id }, isActive: true },
            });

            if (activeChildrenCount > 0) {
              throw new Error(
                'Cannot archive organization with active children. Use archiveChildren=true to archive children as well.',
              );
            }
          }

          // Archive the organization
          organization.isActive = false;
          // organization.status = 'archived'; // Status field doesn't exist, using isActive instead
          await queryRunner.manager.save(organization);
          archived.push(id);

          // Archive children if requested
          if (archiveChildren) {
            const descendants = await this.organizationRepository.findDescendants(organization);
            for (const descendant of descendants) {
              if (descendant.id !== organization.id) {
                descendant.isActive = false;
                // descendant.status = 'archived'; // Status field doesn't exist, using isActive instead
                await queryRunner.manager.save(descendant);
                archived.push(descendant.id);
              }
            }
          }
        } catch (error) {
          failed.push({ id, error: error.message });
        }
      }

      await queryRunner.commitTransaction();
      return { archived, failed };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkActivate(organizationIds: string[]): Promise<{
    activated: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const activated: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const id of organizationIds) {
        try {
          const organization = await queryRunner.manager.findOne(Organization, {
            where: { id },
            relations: ['parent'],
          });

          if (!organization) {
            throw new Error('Organization not found');
          }

          // Check if parent is active (if organization has a parent)
          if (organization.parent && !organization.parent.isActive) {
            throw new Error('Cannot activate organization with inactive parent');
          }

          organization.isActive = true;
          // organization.status = 'active'; // Status field doesn't exist, using isActive instead
          await queryRunner.manager.save(organization);
          activated.push(id);
        } catch (error) {
          failed.push({ id, error: error.message });
        }
      }

      await queryRunner.commitTransaction();
      return { activated, failed };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
