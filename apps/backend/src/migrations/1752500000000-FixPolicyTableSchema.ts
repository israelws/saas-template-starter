import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPolicyTableSchema1752500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, drop the materialized view that depends on the status column
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS organization_hierarchy_view CASCADE`);

    // Drop old columns if they exist
    const oldColumns = ['resource', 'action', 'status'];

    for (const column of oldColumns) {
      const hasColumn = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'policies' 
        AND column_name = '${column}'
      `);

      if (hasColumn.length > 0) {
        await queryRunner.query(`ALTER TABLE "policies" DROP COLUMN "${column}"`);
      }
    }

    // Check if effect column needs to be updated to enum
    const effectColumn = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'policies' 
      AND column_name = 'effect'
    `);

    if (effectColumn.length > 0 && effectColumn[0].data_type !== 'USER-DEFINED') {
      // First create the enum type if it doesn't exist
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "policies_effect_enum" AS ENUM('allow', 'deny');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Update the column to use the enum
      await queryRunner.query(`
        ALTER TABLE "policies" 
        ALTER COLUMN "effect" TYPE "policies_effect_enum" 
        USING effect::"policies_effect_enum"
      `);

      await queryRunner.query(`
        ALTER TABLE "policies" 
        ALTER COLUMN "effect" SET DEFAULT 'allow'::"policies_effect_enum"
      `);
    }

    // Update priority default if needed
    await queryRunner.query(`
      ALTER TABLE "policies" 
      ALTER COLUMN "priority" SET DEFAULT 100
    `);

    // Add missing indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_policies_org_active" 
      ON "policies" ("organizationId", "isActive")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_policies_priority" 
      ON "policies" ("priority")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_policies_policyset" 
      ON "policies" ("policySetId")
    `);

    // Ensure organizationId can be null
    await queryRunner.query(`
      ALTER TABLE "policies" 
      ALTER COLUMN "organizationId" DROP NOT NULL
    `);

    // Recreate the materialized view
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS organization_hierarchy_view AS
      WITH RECURSIVE org_tree AS (
        SELECT 
          o.id,
          o.name,
          o.type,
          o."parentId",
          o."createdAt",
          o."updatedAt",
          o."isActive",
          o.path,
          1 as depth,
          ARRAY[o.id] as ancestors,
          ARRAY[o.name] as ancestor_names
        FROM organizations o
        WHERE o."parentId" IS NULL
        
        UNION ALL
        
        SELECT 
          o.id,
          o.name,
          o.type,
          o."parentId",
          o."createdAt",
          o."updatedAt",
          o."isActive",
          o.path,
          ot.depth + 1,
          ot.ancestors || o.id,
          ot.ancestor_names || o.name
        FROM organizations o
        INNER JOIN org_tree ot ON o."parentId" = ot.id
      )
      SELECT * FROM org_tree
    `);

    // Create index on the materialized view
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_org_hierarchy_id ON organization_hierarchy_view (id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_policies_org_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_policies_priority"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_policies_policyset"`);

    // Add back old columns
    await queryRunner.query(`
      ALTER TABLE "policies" 
      ADD COLUMN IF NOT EXISTS "resource" VARCHAR(255) NOT NULL DEFAULT 'default'
    `);

    await queryRunner.query(`
      ALTER TABLE "policies" 
      ADD COLUMN IF NOT EXISTS "action" VARCHAR(255) NOT NULL DEFAULT 'default'
    `);

    await queryRunner.query(`
      ALTER TABLE "policies" 
      ADD COLUMN IF NOT EXISTS "status" VARCHAR(255) NOT NULL DEFAULT 'active'
    `);

    // Revert effect column
    await queryRunner.query(`
      ALTER TABLE "policies" 
      ALTER COLUMN "effect" TYPE VARCHAR(255) 
      USING effect::text
    `);

    await queryRunner.query(`
      ALTER TABLE "policies" 
      ALTER COLUMN "effect" SET DEFAULT 'allow'
    `);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "policies_effect_enum"`);

    // Revert priority default
    await queryRunner.query(`
      ALTER TABLE "policies" 
      ALTER COLUMN "priority" SET DEFAULT 50
    `);
  }
}
