import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailServiceConfigTable1753690000000 implements MigrationInterface {
  name = 'CreateEmailServiceConfigTable1753690000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type
    await queryRunner.query(
      `CREATE TYPE "public"."email_service_configs_provider_enum" AS ENUM('office365', 'sendgrid', 'twilio', 'aws-ses', 'smtp')`,
    );

    // Create table
    await queryRunner.query(`CREATE TABLE "email_service_configs" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "provider" "public"."email_service_configs_provider_enum" NOT NULL,
            "organizationId" uuid,
            "config" jsonb NOT NULL,
            "enabled" boolean NOT NULL DEFAULT false,
            "isDefault" boolean NOT NULL DEFAULT false,
            "isGlobalDefault" boolean NOT NULL DEFAULT false,
            "lastTestAt" TIMESTAMP,
            "lastTestSuccess" boolean,
            "lastTestError" text,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedBy" uuid,
            CONSTRAINT "PK_email_service_configs" PRIMARY KEY ("id")
        )`);

    // Add foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "email_service_configs" ADD CONSTRAINT "FK_email_service_configs_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Create indexes
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_email_service_configs_provider_org" ON "email_service_configs" ("provider", "organizationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_email_service_configs_provider_null" ON "email_service_configs" ("provider") WHERE "organizationId" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_email_service_configs_provider_null"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_email_service_configs_provider_org"`);

    // Drop foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "email_service_configs" DROP CONSTRAINT IF EXISTS "FK_email_service_configs_organization"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "email_service_configs"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."email_service_configs_provider_enum"`);
  }
}
