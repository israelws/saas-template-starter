import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPolicyScopeField1753500000000 implements MigrationInterface {
  name = 'AddPolicyScopeField1753500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add scope enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "policy_scope_enum" AS ENUM('system', 'organization');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add scope column with default value
    await queryRunner.query(`
      ALTER TABLE "policies" 
      ADD COLUMN "scope" "policy_scope_enum" NOT NULL DEFAULT 'organization'
    `);

    // Make organizationId nullable
    await queryRunner.query(`
      ALTER TABLE "policies" 
      ALTER COLUMN "organizationId" DROP NOT NULL
    `);

    // Update existing policies to have 'organization' scope (already default)
    await queryRunner.query(`
      UPDATE "policies" 
      SET "scope" = 'organization' 
      WHERE "organizationId" IS NOT NULL
    `);

    // Add index for scope
    await queryRunner.query(`
      CREATE INDEX "IDX_policies_scope" ON "policies" ("scope")
    `);

    // Add composite index for scope and organizationId
    await queryRunner.query(`
      CREATE INDEX "IDX_policies_scope_organizationId" ON "policies" ("scope", "organizationId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_policies_scope_organizationId"`);
    await queryRunner.query(`DROP INDEX "IDX_policies_scope"`);

    // Make organizationId required again
    await queryRunner.query(`
      ALTER TABLE "policies" 
      ALTER COLUMN "organizationId" SET NOT NULL
    `);

    // Drop scope column
    await queryRunner.query(`
      ALTER TABLE "policies" 
      DROP COLUMN "scope"
    `);

    // Drop enum type
    await queryRunner.query(`DROP TYPE "policy_scope_enum"`);
  }
}