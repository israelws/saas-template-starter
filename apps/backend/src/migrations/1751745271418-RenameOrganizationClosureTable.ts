import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameOrganizationClosureTable1751745271418 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename organization_closure to organizations_closure to match TypeORM expectations
    await queryRunner.query(`ALTER TABLE "organization_closure" RENAME TO "organizations_closure"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rename back to original
    await queryRunner.query(`ALTER TABLE "organizations_closure" RENAME TO "organization_closure"`);
  }
}
