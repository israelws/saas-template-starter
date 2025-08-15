import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttributeDefinitionColumns1751745316837 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add missing columns to attribute_definitions table
    await queryRunner.query(`
            ALTER TABLE "attribute_definitions" 
            ADD COLUMN IF NOT EXISTS "possibleValues" jsonb,
            ADD COLUMN IF NOT EXISTS "allowedValues" jsonb,
            ADD COLUMN IF NOT EXISTS "isRequired" boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS "isSystem" boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS "metadata" jsonb
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove added columns from attribute_definitions
    await queryRunner.query(`
            ALTER TABLE "attribute_definitions" 
            DROP COLUMN IF EXISTS "possibleValues",
            DROP COLUMN IF EXISTS "allowedValues",
            DROP COLUMN IF EXISTS "isRequired",
            DROP COLUMN IF EXISTS "isSystem",
            DROP COLUMN IF EXISTS "metadata"
        `);
  }
}
