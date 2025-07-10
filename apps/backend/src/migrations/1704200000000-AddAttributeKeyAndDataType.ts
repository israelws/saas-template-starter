import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttributeKeyAndDataType1704200000000 implements MigrationInterface {
  name = 'AddAttributeKeyAndDataType1704200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add key column
    await queryRunner.query(`
      ALTER TABLE "attribute_definitions" 
      ADD COLUMN IF NOT EXISTS "key" VARCHAR(255)
    `);
    
    // Add data_type column
    await queryRunner.query(`
      ALTER TABLE "attribute_definitions" 
      ADD COLUMN IF NOT EXISTS "data_type" VARCHAR(50)
    `);
    
    // Add allowedValues column
    await queryRunner.query(`
      ALTER TABLE "attribute_definitions" 
      ADD COLUMN IF NOT EXISTS "allowedValues" JSONB
    `);
    
    // Update existing records with key based on name if key is null
    await queryRunner.query(`
      UPDATE "attribute_definitions" 
      SET "key" = LOWER(REPLACE("name", ' ', '.'))
      WHERE "key" IS NULL
    `);
    
    // Update data_type to match type if null
    await queryRunner.query(`
      UPDATE "attribute_definitions" 
      SET "data_type" = "type"
      WHERE "data_type" IS NULL
    `);
    
    // Make key column NOT NULL after populating data
    await queryRunner.query(`
      ALTER TABLE "attribute_definitions" 
      ALTER COLUMN "key" SET NOT NULL
    `);
    
    // Create unique index on key
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_attribute_definitions_key" 
      ON "attribute_definitions" ("key")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop unique index on key
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_attribute_definitions_key"`);
    
    // Drop columns
    await queryRunner.query(`ALTER TABLE "attribute_definitions" DROP COLUMN IF EXISTS "key"`);
    await queryRunner.query(`ALTER TABLE "attribute_definitions" DROP COLUMN IF EXISTS "data_type"`);
    await queryRunner.query(`ALTER TABLE "attribute_definitions" DROP COLUMN IF EXISTS "allowedValues"`);
  }
}