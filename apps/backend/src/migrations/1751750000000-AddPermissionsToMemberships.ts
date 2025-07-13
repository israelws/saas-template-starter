import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPermissionsToMemberships1751750000000 implements MigrationInterface {
  name = 'AddPermissionsToMemberships1751750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add permissions column to user_organization_memberships table
    await queryRunner.query(`
      ALTER TABLE "user_organization_memberships" 
      ADD COLUMN IF NOT EXISTS "permissions" text[] DEFAULT '{}'::text[]
    `);

    // Also add the isDefault column that seems to be missing from migrations
    await queryRunner.query(`
      ALTER TABLE "user_organization_memberships" 
      ADD COLUMN IF NOT EXISTS "isDefault" boolean DEFAULT false
    `);

    // Create index for isDefault queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_memberships_userId_isDefault" 
      ON "user_organization_memberships" ("userId", "isDefault")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_memberships_userId_isDefault"
    `);

    // Remove added columns
    await queryRunner.query(`
      ALTER TABLE "user_organization_memberships" 
      DROP COLUMN IF EXISTS "permissions"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_organization_memberships" 
      DROP COLUMN IF EXISTS "isDefault"
    `);
  }
}