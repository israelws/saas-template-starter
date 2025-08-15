import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddMultiRoleSupport1752700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_roles table for multi-role support
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
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
            isNullable: false,
          },
          {
            name: 'role_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'assigned_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'assigned_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'valid_from',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'valid_to',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'priority',
            type: 'integer',
            default: 0,
            comment: 'Higher priority roles take precedence in conflicts',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        columnNames: ['assigned_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'IDX_user_roles_user_org',
        columnNames: ['user_id', 'organization_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'IDX_user_roles_org_role',
        columnNames: ['organization_id', 'role_name'],
      }),
    );

    // Add unique constraint to prevent duplicate active roles
    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'UQ_user_roles_active',
        columnNames: ['user_id', 'role_name', 'organization_id'],
        isUnique: true,
        where: 'is_active = true',
      }),
    );

    // Add columns to user_attributes for organization scoping
    await queryRunner.addColumns('user_attributes', [
      new TableColumn({
        name: 'organization_id',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'valid_from',
        type: 'timestamp',
        default: 'CURRENT_TIMESTAMP',
      }),
      new TableColumn({
        name: 'valid_to',
        type: 'timestamp',
        isNullable: true,
      }),
    ]);

    // Add foreign key for organization_id in user_attributes
    await queryRunner.createForeignKey(
      'user_attributes',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      }),
    );

    // Add field_permissions column to policies table for field-level access control
    await queryRunner.addColumn(
      'policies',
      new TableColumn({
        name: 'field_permissions',
        type: 'jsonb',
        isNullable: true,
        comment: 'Field-level permissions configuration',
      }),
    );

    // Create policy_field_rules table for more granular field control
    await queryRunner.createTable(
      new Table({
        name: 'policy_field_rules',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'policy_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'resource_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'field_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'permission',
            type: 'varchar',
            length: '20',
            isNullable: false,
            comment: 'read, write, or deny',
          },
          {
            name: 'conditions',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key for policy_field_rules
    await queryRunner.createForeignKey(
      'policy_field_rules',
      new TableForeignKey({
        columnNames: ['policy_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'policies',
        onDelete: 'CASCADE',
      }),
    );

    // Create index for field rules lookup
    await queryRunner.createIndex(
      'policy_field_rules',
      new TableIndex({
        name: 'IDX_policy_field_rules_lookup',
        columnNames: ['policy_id', 'resource_type', 'field_name'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop policy_field_rules table
    await queryRunner.dropTable('policy_field_rules');

    // Remove field_permissions column from policies
    await queryRunner.dropColumn('policies', 'field_permissions');

    // Remove columns from user_attributes
    const userAttributesTable = await queryRunner.getTable('user_attributes');
    const orgForeignKey = userAttributesTable?.foreignKeys.find((fk) =>
      fk.columnNames.includes('organization_id'),
    );
    if (orgForeignKey) {
      await queryRunner.dropForeignKey('user_attributes', orgForeignKey);
    }

    await queryRunner.dropColumn('user_attributes', 'organization_id');
    await queryRunner.dropColumn('user_attributes', 'valid_from');
    await queryRunner.dropColumn('user_attributes', 'valid_to');

    // Drop user_roles table
    await queryRunner.dropTable('user_roles');
  }
}
