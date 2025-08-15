import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddInsuranceEntities1752800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create territories table
    await queryRunner.createTable(
      new Table({
        name: 'territories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'code',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['zipcode', 'city', 'county', 'state', 'region'],
          },
          {
            name: 'parent_territory_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'boundaries',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['parent_territory_id'],
            referencedTableName: 'territories',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    // Create insurance_branches table
    await queryRunner.createTable(
      new Table({
        name: 'insurance_branches',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'branch_code',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'branch_name',
            type: 'varchar',
          },
          {
            name: 'manager_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'jsonb',
          },
          {
            name: 'phone_number',
            type: 'varchar',
          },
          {
            name: 'email',
            type: 'varchar',
          },
          {
            name: 'operating_hours',
            type: 'jsonb',
          },
          {
            name: 'service_types',
            type: 'text',
          },
          {
            name: 'territory_ids',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['organization_id'],
            referencedTableName: 'organizations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['manager_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    // Create insurance_agents table
    await queryRunner.createTable(
      new Table({
        name: 'insurance_agents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'branch_id',
            type: 'uuid',
          },
          {
            name: 'agent_code',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'license_number',
            type: 'varchar',
          },
          {
            name: 'license_type',
            type: 'text',
          },
          {
            name: 'license_status',
            type: 'enum',
            enum: ['active', 'expired', 'suspended', 'pending'],
            default: "'pending'",
          },
          {
            name: 'license_expiry_date',
            type: 'timestamp',
          },
          {
            name: 'commission_rate',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'specializations',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'territory_ids',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'performance_metrics',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['branch_id'],
            referencedTableName: 'insurance_branches',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_territories_type" ON "territories" ("type")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_territories_parent" ON "territories" ("parent_territory_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_insurance_branches_org" ON "insurance_branches" ("organization_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_insurance_branches_manager" ON "insurance_branches" ("manager_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_insurance_agents_user" ON "insurance_agents" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_insurance_agents_branch" ON "insurance_agents" ("branch_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_insurance_agents_license" ON "insurance_agents" ("license_number")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('insurance_agents');
    await queryRunner.dropTable('insurance_branches');
    await queryRunner.dropTable('territories');
  }
}
