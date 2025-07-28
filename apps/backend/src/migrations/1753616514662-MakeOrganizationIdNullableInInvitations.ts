import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeOrganizationIdNullableInInvitations1753616514662 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make organizationId nullable in invitations table
        await queryRunner.query(`
            ALTER TABLE "invitations" 
            ALTER COLUMN "organizationId" DROP NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert: make organizationId required again
        // First, delete any invitations with null organizationId
        await queryRunner.query(`
            DELETE FROM "invitations" 
            WHERE "organizationId" IS NULL
        `);
        
        // Then make the column NOT NULL again
        await queryRunner.query(`
            ALTER TABLE "invitations" 
            ALTER COLUMN "organizationId" SET NOT NULL
        `);
    }

}
