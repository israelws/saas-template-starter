import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingColumnsToWorkflowExecutions1762200000000 implements MigrationInterface {
  name = 'AddMissingColumnsToWorkflowExecutions1762200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "workflow_executions" 
      DROP COLUMN IF EXISTS "error"
    `);

    await queryRunner.query(`
      ALTER TABLE "workflow_executions" 
      DROP COLUMN IF EXISTS "metadata"
    `);
  }
}