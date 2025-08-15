import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingColumns1751745202744 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add missing columns to organizations table
    await queryRunner.query(`
            ALTER TABLE "organizations" 
            ADD COLUMN IF NOT EXISTS "metadata" jsonb,
            ADD COLUMN IF NOT EXISTS "isActive" boolean DEFAULT true,
            ADD COLUMN IF NOT EXISTS "path" text
        `);

    // Add missing columns to users table
    await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "displayName" varchar(200),
            ADD COLUMN IF NOT EXISTS "contactInfo" jsonb,
            ADD COLUMN IF NOT EXISTS "preferences" jsonb,
            ADD COLUMN IF NOT EXISTS "lastLoginAt" timestamp with time zone,
            ADD COLUMN IF NOT EXISTS "emailVerified" boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS "metadata" jsonb
        `);

    // Add missing columns to user_organization_memberships table
    await queryRunner.query(`
            ALTER TABLE "user_organization_memberships" 
            ADD COLUMN IF NOT EXISTS "status" varchar NOT NULL DEFAULT 'active',
            ADD COLUMN IF NOT EXISTS "isActive" boolean DEFAULT true,
            ADD COLUMN IF NOT EXISTS "metadata" jsonb
        `);

    // Add missing columns to attribute_definitions table
    await queryRunner.query(`
            ALTER TABLE "attribute_definitions" 
            ADD COLUMN IF NOT EXISTS "possibleValues" jsonb,
            ADD COLUMN IF NOT EXISTS "allowedValues" jsonb,
            ADD COLUMN IF NOT EXISTS "isRequired" boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS "isSystem" boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS "metadata" jsonb
        `);

    // Add createdBy and updatedBy columns to all tables (but not enforced)
    const tables = [
      'organizations',
      'users',
      'user_organization_memberships',
      'policies',
      'policy_sets',
      'attribute_definitions',
      'products',
      'customers',
      'orders',
      'order_items',
      'transactions',
    ];

    for (const table of tables) {
      await queryRunner.query(`
                DO $$ 
                BEGIN 
                    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}') THEN
                        ALTER TABLE "${table}" 
                        ADD COLUMN IF NOT EXISTS "createdBy" varchar(255),
                        ADD COLUMN IF NOT EXISTS "updatedBy" varchar(255);
                    END IF;
                END $$;
            `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove added columns from organizations
    await queryRunner.query(`
            ALTER TABLE "organizations" 
            DROP COLUMN IF EXISTS "metadata",
            DROP COLUMN IF EXISTS "isActive",
            DROP COLUMN IF EXISTS "path"
        `);

    // Remove added columns from users
    await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "displayName",
            DROP COLUMN IF EXISTS "contactInfo",
            DROP COLUMN IF EXISTS "preferences",
            DROP COLUMN IF EXISTS "lastLoginAt",
            DROP COLUMN IF EXISTS "emailVerified",
            DROP COLUMN IF EXISTS "metadata"
        `);

    // Remove added columns from user_organization_memberships
    await queryRunner.query(`
            ALTER TABLE "user_organization_memberships" 
            DROP COLUMN IF EXISTS "status",
            DROP COLUMN IF EXISTS "isActive",
            DROP COLUMN IF EXISTS "metadata"
        `);

    // Remove added columns from attribute_definitions
    await queryRunner.query(`
            ALTER TABLE "attribute_definitions" 
            DROP COLUMN IF EXISTS "possibleValues",
            DROP COLUMN IF EXISTS "allowedValues",
            DROP COLUMN IF EXISTS "isRequired",
            DROP COLUMN IF EXISTS "isSystem",
            DROP COLUMN IF EXISTS "metadata"
        `);

    // Remove createdBy and updatedBy columns
    const tables = [
      'organizations',
      'users',
      'user_organization_memberships',
      'policies',
      'policy_sets',
      'attribute_definitions',
      'products',
      'customers',
      'orders',
      'order_items',
      'transactions',
    ];

    for (const table of tables) {
      await queryRunner.query(`
                DO $$ 
                BEGIN 
                    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}') THEN
                        ALTER TABLE "${table}" 
                        DROP COLUMN IF EXISTS "createdBy",
                        DROP COLUMN IF EXISTS "updatedBy";
                    END IF;
                END $$;
            `);
    }
  }
}
