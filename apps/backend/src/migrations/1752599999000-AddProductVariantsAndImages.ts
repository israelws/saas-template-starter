import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductVariantsAndImages1752599999000 implements MigrationInterface {
  name = 'AddProductVariantsAndImages1752599999000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add variants and images columns to products table
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "variants" jsonb,
      ADD COLUMN IF NOT EXISTS "images" jsonb;
    `);

    // Create index for variants to improve query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_variants" 
      ON "products" USING gin ("variants");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_variants"`);
    
    // Drop the columns
    await queryRunner.query(`
      ALTER TABLE "products" 
      DROP COLUMN IF EXISTS "variants",
      DROP COLUMN IF EXISTS "images";
    `);
  }
}