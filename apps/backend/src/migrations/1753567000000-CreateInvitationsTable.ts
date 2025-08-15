import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvitationsTable1753567000000 implements MigrationInterface {
  name = 'CreateInvitationsTable1753567000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."invitations_status_enum" AS ENUM('pending', 'accepted', 'expired', 'revoked')
    `);

    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "firstName" character varying(100),
        "lastName" character varying(100),
        "organizationId" uuid NOT NULL,
        "invitedById" uuid NOT NULL,
        "roleId" character varying(100) NOT NULL,
        "token" character varying(500) NOT NULL,
        "status" "public"."invitations_status_enum" NOT NULL DEFAULT 'pending',
        "expiresAt" TIMESTAMP NOT NULL,
        "acceptedAt" TIMESTAMP,
        "acceptedUserId" uuid,
        "metadata" json,
        "resendCount" integer NOT NULL DEFAULT 0,
        "lastResentAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_invitation_token" UNIQUE ("token"),
        CONSTRAINT "PK_invitation_id" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_invitation_email_organization" ON "invitations" ("email", "organizationId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invitation_token" ON "invitations" ("token")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invitation_status" ON "invitations" ("status")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "invitations" 
      ADD CONSTRAINT "FK_invitation_organization" 
      FOREIGN KEY ("organizationId") 
      REFERENCES "organizations"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "invitations" 
      ADD CONSTRAINT "FK_invitation_invited_by" 
      FOREIGN KEY ("invitedById") 
      REFERENCES "users"("id") 
      ON DELETE SET NULL 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "invitations" 
      ADD CONSTRAINT "FK_invitation_accepted_user" 
      FOREIGN KEY ("acceptedUserId") 
      REFERENCES "users"("id") 
      ON DELETE SET NULL 
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitation_accepted_user"`,
    );
    await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitation_invited_by"`);
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitation_organization"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_invitation_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_invitation_token"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_invitation_email_organization"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "invitations"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE "public"."invitations_status_enum"`);
  }
}
