import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface OrganizationHierarchyNode {
  id: string;
  parentId: string | null;
  name: string;
  code: string;
  type: string;
  status: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  rootId: string;
  rootName: string;
  depth: number;
  path: string[];
  namePath: string[];
  fullPath: string;
  directChildrenCount: number;
  totalDescendantsCount: number;
  totalUsersCount: number;
  activePoliciesCount: number;
}

export interface OrganizationStats {
  id: string;
  name: string;
  type: string;
  status: string;
  directChildrenCount: number;
  totalDescendantsCount: number;
  directUsersCount: number;
  totalUsersCount: number;
  directPoliciesCount: number;
  totalPoliciesCount: number;
  productsCount: number;
  customersCount: number;
}

@Injectable()
export class OrganizationHierarchyService implements OnModuleInit {
  private readonly logger = new Logger(OrganizationHierarchyService.name);
  private isRefreshing = false;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // Listen for PostgreSQL notifications
    const client = await this.dataSource.query('SELECT pg_backend_pid()');
    this.logger.log(`Connected to PostgreSQL with PID: ${client[0].pg_backend_pid}`);

    // Set up listener for refresh notifications
    await this.dataSource.query('LISTEN refresh_org_hierarchy');

    // Initial refresh of the materialized view
    await this.refreshHierarchyView();
  }

  /**
   * Refresh the materialized view
   */
  async refreshHierarchyView(): Promise<void> {
    if (this.isRefreshing) {
      this.logger.warn('Hierarchy view refresh already in progress, skipping...');
      return;
    }

    this.isRefreshing = true;
    const startTime = Date.now();

    try {
      await this.dataSource.query(
        'REFRESH MATERIALIZED VIEW CONCURRENTLY organization_hierarchy_view',
      );
      const duration = Date.now() - startTime;
      this.logger.log(`Organization hierarchy view refreshed in ${duration}ms`);
    } catch (error) {
      this.logger.error({ message: 'Failed to refresh organization hierarchy view', error: error });
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Scheduled refresh of the materialized view (every 5 minutes)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledRefresh() {
    await this.refreshHierarchyView();
  }

  /**
   * Get the complete hierarchy for an organization
   */
  async getOrganizationHierarchy(organizationId: string): Promise<OrganizationHierarchyNode[]> {
    const query = `
      SELECT * FROM organization_hierarchy_view
      WHERE $1::uuid = ANY(path)
      ORDER BY depth, name
    `;

    const result = await this.dataSource.query(query, [organizationId]);
    return this.mapHierarchyResults(result);
  }

  /**
   * Get organizations at a specific depth level
   */
  async getOrganizationsByDepth(depth: number): Promise<OrganizationHierarchyNode[]> {
    const query = `
      SELECT * FROM organization_hierarchy_view
      WHERE depth = $1
      ORDER BY root_name, full_path
    `;

    const result = await this.dataSource.query(query, [depth]);
    return this.mapHierarchyResults(result);
  }

  /**
   * Get all root organizations
   */
  async getRootOrganizations(): Promise<OrganizationHierarchyNode[]> {
    const query = `
      SELECT * FROM organization_hierarchy_view
      WHERE depth = 0
      ORDER BY name
    `;

    const result = await this.dataSource.query(query);
    return this.mapHierarchyResults(result);
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStats(organizationId: string): Promise<OrganizationStats> {
    const query = `
      SELECT * FROM organization_stats_view
      WHERE id = $1
    `;

    const result = await this.dataSource.query(query, [organizationId]);
    if (result.length === 0) {
      return null;
    }

    return this.mapStatsResult(result[0]);
  }

  /**
   * Get statistics for multiple organizations
   */
  async getBulkOrganizationStats(organizationIds: string[]): Promise<OrganizationStats[]> {
    if (organizationIds.length === 0) {
      return [];
    }

    const query = `
      SELECT * FROM organization_stats_view
      WHERE id = ANY($1::uuid[])
    `;

    const result = await this.dataSource.query(query, [organizationIds]);
    return result.map((row) => this.mapStatsResult(row));
  }

  /**
   * Search organizations in the hierarchy
   */
  async searchHierarchy(
    searchTerm: string,
    filters?: {
      type?: string;
      status?: string;
      minDepth?: number;
      maxDepth?: number;
      rootId?: string;
    },
  ): Promise<OrganizationHierarchyNode[]> {
    let query = `
      SELECT * FROM organization_hierarchy_view
      WHERE (
        LOWER(name) LIKE LOWER($1) OR
        LOWER(code) LIKE LOWER($1) OR
        LOWER(full_path) LIKE LOWER($1)
      )
    `;
    const params: any[] = [`%${searchTerm}%`];
    let paramIndex = 2;

    if (filters?.type) {
      query += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.minDepth !== undefined) {
      query += ` AND depth >= $${paramIndex}`;
      params.push(filters.minDepth);
      paramIndex++;
    }

    if (filters?.maxDepth !== undefined) {
      query += ` AND depth <= $${paramIndex}`;
      params.push(filters.maxDepth);
      paramIndex++;
    }

    if (filters?.rootId) {
      query += ` AND root_id = $${paramIndex}::uuid`;
      params.push(filters.rootId);
      paramIndex++;
    }

    query += ' ORDER BY depth, full_path';

    const result = await this.dataSource.query(query, params);
    return this.mapHierarchyResults(result);
  }

  /**
   * Get the path from root to a specific organization
   */
  async getOrganizationPath(organizationId: string): Promise<OrganizationHierarchyNode[]> {
    const query = `
      SELECT oh.*
      FROM organization_hierarchy_view oh
      WHERE oh.id IN (
        SELECT unnest(path) FROM organization_hierarchy_view WHERE id = $1::uuid
      )
      ORDER BY depth
    `;

    const result = await this.dataSource.query(query, [organizationId]);
    return this.mapHierarchyResults(result);
  }

  /**
   * Get sibling organizations (same parent)
   */
  async getSiblingOrganizations(organizationId: string): Promise<OrganizationHierarchyNode[]> {
    const query = `
      SELECT sibling.*
      FROM organization_hierarchy_view target
      JOIN organization_hierarchy_view sibling ON sibling."parentId" = target."parentId"
      WHERE target.id = $1::uuid AND sibling.id != $1::uuid
      ORDER BY sibling.name
    `;

    const result = await this.dataSource.query(query, [organizationId]);
    return this.mapHierarchyResults(result);
  }

  private mapHierarchyResults(results: any[]): OrganizationHierarchyNode[] {
    return results.map((row) => ({
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      code: row.code,
      type: row.type,
      status: row.status,
      settings: row.settings,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      rootId: row.root_id,
      rootName: row.root_name,
      depth: row.depth,
      path: row.path,
      namePath: row.name_path,
      fullPath: row.full_path,
      directChildrenCount: parseInt(row.direct_children_count || '0'),
      totalDescendantsCount: parseInt(row.total_descendants_count || '0'),
      totalUsersCount: parseInt(row.total_users_count || '0'),
      activePoliciesCount: parseInt(row.active_policies_count || '0'),
    }));
  }

  private mapStatsResult(row: any): OrganizationStats {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      directChildrenCount: parseInt(row.direct_children_count || '0'),
      totalDescendantsCount: parseInt(row.total_descendants_count || '0'),
      directUsersCount: parseInt(row.direct_users_count || '0'),
      totalUsersCount: parseInt(row.total_users_count || '0'),
      directPoliciesCount: parseInt(row.direct_policies_count || '0'),
      totalPoliciesCount: parseInt(row.total_policies_count || '0'),
      productsCount: parseInt(row.products_count || '0'),
      customersCount: parseInt(row.customers_count || '0'),
    };
  }
}
