import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserAttributesTable1704300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_attributes table
    await queryRunner.query(`
      CREATE TABLE "user_attributes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "organizationId" uuid NOT NULL,
        "key" VARCHAR(100) NOT NULL,
        "value" jsonb NOT NULL,
        "dataType" VARCHAR(50) NOT NULL DEFAULT 'string',
        "isPublic" boolean NOT NULL DEFAULT true,
        "description" text,
        "createdAt" timestamp with time zone NOT NULL DEFAULT NOW(),
        "updatedAt" timestamp with time zone NOT NULL DEFAULT NOW()
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "user_attributes" 
      ADD CONSTRAINT "FK_user_attributes_userId" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_attributes" 
      ADD CONSTRAINT "FK_user_attributes_organizationId" 
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    // Add unique constraint
    await queryRunner.query(`
      ALTER TABLE "user_attributes" 
      ADD CONSTRAINT "UQ_user_attributes_user_org_key" 
      UNIQUE ("userId", "organizationId", "key")
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_user_attributes_userId_organizationId" 
      ON "user_attributes" ("userId", "organizationId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_attributes_organizationId_key" 
      ON "user_attributes" ("organizationId", "key")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_attributes_value" 
      ON "user_attributes" USING GIN ("value")
    `);

    // Create index for public attributes for faster queries
    await queryRunner.query(`
      CREATE INDEX "IDX_user_attributes_public" 
      ON "user_attributes" ("organizationId", "isPublic") 
      WHERE "isPublic" = true
    `);

    // Add comment to data type column
    await queryRunner.query(`
      COMMENT ON COLUMN "user_attributes"."dataType" 
      IS 'Data type: string, number, boolean, array, object'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "user_attributes"."isPublic" 
      IS 'Whether this attribute is visible to other users in the organization'
    `);

    // Create function to validate data type consistency
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION validate_user_attribute_data_type()
      RETURNS trigger AS $$
      BEGIN
        -- Validate that the value matches the declared data type
        CASE NEW."dataType"
          WHEN 'string' THEN
            IF jsonb_typeof(NEW."value") != 'string' THEN
              RAISE EXCEPTION 'Value must be a string for dataType=string';
            END IF;
          WHEN 'number' THEN
            IF jsonb_typeof(NEW."value") != 'number' THEN
              RAISE EXCEPTION 'Value must be a number for dataType=number';
            END IF;
          WHEN 'boolean' THEN
            IF jsonb_typeof(NEW."value") != 'boolean' THEN
              RAISE EXCEPTION 'Value must be a boolean for dataType=boolean';
            END IF;
          WHEN 'array' THEN
            IF jsonb_typeof(NEW."value") != 'array' THEN
              RAISE EXCEPTION 'Value must be an array for dataType=array';
            END IF;
          WHEN 'object' THEN
            IF jsonb_typeof(NEW."value") != 'object' THEN
              RAISE EXCEPTION 'Value must be an object for dataType=object';
            END IF;
        END CASE;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger to validate data type
    await queryRunner.query(`
      CREATE TRIGGER trigger_validate_user_attribute_data_type
      BEFORE INSERT OR UPDATE ON "user_attributes"
      FOR EACH ROW
      EXECUTE FUNCTION validate_user_attribute_data_type();
    `);

    // Create function to automatically update updatedAt
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_user_attributes_updated_at()
      RETURNS trigger AS $$
      BEGIN
        NEW."updatedAt" = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger to automatically update updatedAt
    await queryRunner.query(`
      CREATE TRIGGER trigger_update_user_attributes_updated_at
      BEFORE UPDATE ON "user_attributes"
      FOR EACH ROW
      EXECUTE FUNCTION update_user_attributes_updated_at();
    `);

    // Create view for attribute statistics
    await queryRunner.query(`
      CREATE VIEW user_attribute_stats AS
      SELECT 
        "organizationId",
        "key",
        COUNT(*) as usage_count,
        COUNT(DISTINCT "userId") as unique_users,
        MODE() WITHIN GROUP (ORDER BY jsonb_typeof("value")) as most_common_type,
        MIN("createdAt") as first_used,
        MAX("updatedAt") as last_updated,
        COUNT(CASE WHEN "isPublic" = true THEN 1 END) as public_count,
        COUNT(CASE WHEN "isPublic" = false THEN 1 END) as private_count
      FROM "user_attributes"
      GROUP BY "organizationId", "key"
      ORDER BY "organizationId", usage_count DESC;
    `);

    // Create view for user attribute summary
    await queryRunner.query(`
      CREATE VIEW user_attribute_summary AS
      SELECT 
        ua."userId",
        ua."organizationId",
        u."email",
        u."firstName",
        u."lastName",
        COUNT(ua.id) as total_attributes,
        COUNT(CASE WHEN ua."isPublic" = true THEN 1 END) as public_attributes,
        COUNT(CASE WHEN ua."isPublic" = false THEN 1 END) as private_attributes,
        jsonb_object_agg(ua."key", ua."value") FILTER (WHERE ua."isPublic" = true) as public_attribute_values,
        MAX(ua."updatedAt") as last_attribute_update
      FROM "user_attributes" ua
      JOIN "users" u ON u.id = ua."userId"
      GROUP BY ua."userId", ua."organizationId", u."email", u."firstName", u."lastName"
      ORDER BY total_attributes DESC;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop views
    await queryRunner.query(`DROP VIEW IF EXISTS user_attribute_summary`);
    await queryRunner.query(`DROP VIEW IF EXISTS user_attribute_stats`);

    // Drop triggers
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_update_user_attributes_updated_at ON "user_attributes"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trigger_validate_user_attribute_data_type ON "user_attributes"`,
    );

    // Drop functions
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_user_attributes_updated_at()`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS validate_user_attribute_data_type()`);

    // Drop table (foreign keys will be dropped automatically)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_attributes"`);
  }
}
