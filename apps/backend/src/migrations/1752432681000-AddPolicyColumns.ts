import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPolicyColumns1752432681000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if subjects column exists
    const hasSubjectsColumn = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'policies' 
      AND column_name = 'subjects'
    `);

    if (hasSubjectsColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "policies" 
        ADD COLUMN "subjects" jsonb NOT NULL DEFAULT '[]'::jsonb
      `);
    }

    // Check if resources column exists
    const hasResourcesColumn = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'policies' 
      AND column_name = 'resources'
    `);

    if (hasResourcesColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "policies" 
        ADD COLUMN "resources" jsonb NOT NULL DEFAULT '[]'::jsonb
      `);
    }

    // Check if conditions column exists
    const hasConditionsColumn = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'policies' 
      AND column_name = 'conditions'
    `);

    if (hasConditionsColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "policies" 
        ADD COLUMN "conditions" jsonb
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if subjects column exists before dropping
    const hasSubjectsColumn = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'policies' 
      AND column_name = 'subjects'
    `);

    if (hasSubjectsColumn.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "policies" 
        DROP COLUMN "subjects"
      `);
    }

    // Check if resources column exists before dropping
    const hasResourcesColumn = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'policies' 
      AND column_name = 'resources'
    `);

    if (hasResourcesColumn.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "policies" 
        DROP COLUMN "resources"
      `);
    }

    // Check if conditions column exists before dropping
    const hasConditionsColumn = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'policies' 
      AND column_name = 'conditions'
    `);

    if (hasConditionsColumn.length > 0) {
      await queryRunner.query(`
        ALTER TABLE "policies" 
        DROP COLUMN "conditions"
      `);
    }
  }
}
