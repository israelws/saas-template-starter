import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrgIdToWorkflowExecutions1762100000000 implements MigrationInterface {
  name = 'AddOrgIdToWorkflowExecutions1762100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add organizationId column to workflow_executions
    await queryRunner.query(`
      ALTER TABLE "workflow_executions" 
      ADD COLUMN IF NOT EXISTS "organizationId" uuid
    `);

    // Add input and output columns if they don't exist
    await queryRunner.query(`
      ALTER TABLE "workflow_executions" 
      ADD COLUMN IF NOT EXISTS "input" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "workflow_executions" 
      ADD COLUMN IF NOT EXISTS "output" jsonb
    `);

    // Add error column
    await queryRunner.query(`
      ALTER TABLE "workflow_executions" 
      ADD COLUMN IF NOT EXISTS "error" text
    `);

    // Add metadata column
    await queryRunner.query(`
      ALTER TABLE "workflow_executions" 
      ADD COLUMN IF NOT EXISTS "metadata" jsonb
    `);

    // Update existing records to set organizationId from their workflow
    await queryRunner.query(`
      UPDATE "workflow_executions" we
      SET "organizationId" = w."organizationId"
      FROM "ai_workflows" w
      WHERE we."workflowId" = w.id
      AND we."organizationId" IS NULL
    `);

    // Only make organizationId NOT NULL if it doesn't have the constraint already
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'workflow_executions' 
          AND column_name = 'organizationId' 
          AND is_nullable = 'YES'
        ) THEN
          ALTER TABLE "workflow_executions" 
          ALTER COLUMN "organizationId" SET NOT NULL;
        END IF;
      END $$;
    `);

    // Add index for performance if it doesn't exist
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_workflow_executions_organization" 
      ON "workflow_executions" ("organizationId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_workflow_executions_organization"
    `);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "workflow_executions" 
      DROP COLUMN IF EXISTS "organizationId"
    `);

    await queryRunner.query(`
      ALTER TABLE "workflow_executions" 
      DROP COLUMN IF EXISTS "input"
    `);

    await queryRunner.query(`
      ALTER TABLE "workflow_executions" 
      DROP COLUMN IF EXISTS "output"
    `);
  }
}