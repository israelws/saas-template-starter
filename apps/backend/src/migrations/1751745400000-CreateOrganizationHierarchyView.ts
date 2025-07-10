import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationHierarchyView1751745400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create materialized view for organization hierarchy
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW organization_hierarchy_view AS
      WITH RECURSIVE org_tree AS (
        -- Base case: root organizations
        SELECT 
          o.id,
          o."parentId",
          o.name,
          o.code,
          o.type,
          o.status,
          o.settings,
          o."createdAt",
          o."updatedAt",
          o.id as root_id,
          o.name as root_name,
          0 as depth,
          ARRAY[o.id] as path,
          ARRAY[o.name] as name_path,
          o.name::text as full_path
        FROM organizations o
        WHERE o."parentId" IS NULL
        
        UNION ALL
        
        -- Recursive case
        SELECT 
          o.id,
          o."parentId",
          o.name,
          o.code,
          o.type,
          o.status,
          o.settings,
          o."createdAt",
          o."updatedAt",
          ot.root_id,
          ot.root_name,
          ot.depth + 1,
          ot.path || o.id,
          ot.name_path || o.name,
          ot.full_path || ' > ' || o.name
        FROM organizations o
        JOIN org_tree ot ON o."parentId" = ot.id
      )
      SELECT 
        ot.*,
        (
          SELECT COUNT(*)
          FROM organizations o2
          WHERE o2."parentId" = ot.id
        ) as direct_children_count,
        (
          SELECT COUNT(*)
          FROM organizations_closure oc
          WHERE oc."id_ancestor" = ot.id AND oc."id_descendant" != ot.id
        ) as total_descendants_count,
        (
          SELECT COUNT(DISTINCT uom."userId")
          FROM user_organization_memberships uom
          JOIN organizations_closure oc ON oc."id_descendant" = uom."organizationId"
          WHERE oc."id_ancestor" = ot.id
        ) as total_users_count,
        (
          SELECT COUNT(DISTINCT p.id)
          FROM policies p
          JOIN organizations_closure oc ON oc."id_descendant" = p."organizationId"
          WHERE oc."id_ancestor" = ot.id AND p.status = 'active'
        ) as active_policies_count
      FROM org_tree ot
    `);

    // Create unique index for concurrent refresh
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_org_hierarchy_view_id_unique ON organization_hierarchy_view(id)
    `);

    // Create indexes on the materialized view
    await queryRunner.query(`
      CREATE INDEX idx_org_hierarchy_view_parent_id ON organization_hierarchy_view("parentId")
    `);
    
    await queryRunner.query(`
      CREATE INDEX idx_org_hierarchy_view_root_id ON organization_hierarchy_view(root_id)
    `);
    
    await queryRunner.query(`
      CREATE INDEX idx_org_hierarchy_view_depth ON organization_hierarchy_view(depth)
    `);
    
    await queryRunner.query(`
      CREATE INDEX idx_org_hierarchy_view_path ON organization_hierarchy_view USING GIN(path)
    `);

    // Create function to refresh the materialized view
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION refresh_organization_hierarchy_view()
      RETURNS void AS $$
      BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY organization_hierarchy_view;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create triggers to refresh view on organization changes
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION trigger_refresh_org_hierarchy()
      RETURNS trigger AS $$
      BEGIN
        -- Refresh the view asynchronously using pg_notify
        PERFORM pg_notify('refresh_org_hierarchy', 'refresh');
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER refresh_org_hierarchy_on_insert
      AFTER INSERT ON organizations
      FOR EACH STATEMENT
      EXECUTE FUNCTION trigger_refresh_org_hierarchy();
    `);

    await queryRunner.query(`
      CREATE TRIGGER refresh_org_hierarchy_on_update
      AFTER UPDATE ON organizations
      FOR EACH STATEMENT
      EXECUTE FUNCTION trigger_refresh_org_hierarchy();
    `);

    await queryRunner.query(`
      CREATE TRIGGER refresh_org_hierarchy_on_delete
      AFTER DELETE ON organizations
      FOR EACH STATEMENT
      EXECUTE FUNCTION trigger_refresh_org_hierarchy();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS refresh_org_hierarchy_on_delete ON organizations`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS refresh_org_hierarchy_on_update ON organizations`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS refresh_org_hierarchy_on_insert ON organizations`);
    
    // Drop functions
    await queryRunner.query(`DROP FUNCTION IF EXISTS trigger_refresh_org_hierarchy()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS refresh_organization_hierarchy_view()`);
    
    // Drop materialized view
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS organization_hierarchy_view`);
  }
}