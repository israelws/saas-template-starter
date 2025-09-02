import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateAIWorkflowTables1761000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ai_workflows table
    await queryRunner.createTable(
      new Table({
        name: 'ai_workflows',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organizationId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'triggerType',
            type: 'varchar',
            length: '50',
            comment: 'manual, event, scheduled, api',
          },
          {
            name: 'entityType',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'task, order, customer, etc.',
          },
          {
            name: 'flowDefinition',
            type: 'jsonb',
            comment: 'React Flow graph structure',
          },
          {
            name: 'inputSchema',
            type: 'jsonb',
            isNullable: true,
            comment: 'Expected input structure',
          },
          {
            name: 'outputSchema',
            type: 'jsonb',
            isNullable: true,
            comment: 'Expected output structure',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isTemplate',
            type: 'boolean',
            default: false,
          },
          {
            name: 'version',
            type: 'int',
            default: 1,
          },
          {
            name: 'createdById',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['organizationId'],
            referencedTableName: 'organizations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['createdById'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    // Create workflow_executions table
    await queryRunner.createTable(
      new Table({
        name: 'workflow_executions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'workflowId',
            type: 'uuid',
          },
          {
            name: 'triggerEntityType',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'task, order, customer, etc.',
          },
          {
            name: 'triggerEntityId',
            type: 'uuid',
            isNullable: true,
            comment: 'ID of the triggering entity',
          },
          {
            name: 'triggerEvent',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'status_changed, created, etc.',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            comment: 'pending, running, completed, failed',
          },
          {
            name: 'inputData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'outputData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'executionLog',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'startedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['workflowId'],
            referencedTableName: 'ai_workflows',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create workflow_bindings table
    await queryRunner.createTable(
      new Table({
        name: 'workflow_bindings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'workflowId',
            type: 'uuid',
          },
          {
            name: 'entityType',
            type: 'varchar',
            length: '50',
            comment: 'task_type, order_status, etc.',
          },
          {
            name: 'entityId',
            type: 'uuid',
            isNullable: true,
            comment: 'Specific task_type_id, etc.',
          },
          {
            name: 'eventName',
            type: 'varchar',
            length: '100',
            comment: 'lifecycle_changed, assigned, etc.',
          },
          {
            name: 'condition',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional conditions for triggering',
          },
          {
            name: 'priority',
            type: 'int',
            default: 0,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['workflowId'],
            referencedTableName: 'ai_workflows',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create ai_models table
    await queryRunner.createTable(
      new Table({
        name: 'ai_models',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organizationId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '50',
            comment: 'openai, anthropic, local, etc.',
          },
          {
            name: 'modelName',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'apiKey',
            type: 'text',
            isNullable: true,
            comment: 'Encrypted API key',
          },
          {
            name: 'configuration',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['organizationId'],
            referencedTableName: 'organizations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create workflow_documents table
    await queryRunner.createTable(
      new Table({
        name: 'workflow_documents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'organizationId',
            type: 'uuid',
          },
          {
            name: 'workflowId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'fileName',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'fileType',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'embeddings',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['organizationId'],
            referencedTableName: 'organizations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['workflowId'],
            referencedTableName: 'ai_workflows',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    // Update lifecycle_webhooks table to support workflows
    await queryRunner.query(`
      ALTER TABLE lifecycle_webhooks 
      ADD COLUMN IF NOT EXISTS execution_type VARCHAR(20) DEFAULT 'webhook',
      ADD COLUMN IF NOT EXISTS workflow_id UUID,
      ADD COLUMN IF NOT EXISTS execution_mode VARCHAR(20) DEFAULT 'async'
    `);

    await queryRunner.query(`
      ALTER TABLE lifecycle_webhooks
      ADD CONSTRAINT fk_lifecycle_webhooks_workflow
      FOREIGN KEY (workflow_id) REFERENCES ai_workflows(id) ON DELETE SET NULL
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_ai_workflows_organization" ON "ai_workflows" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_ai_workflows_trigger_type" ON "ai_workflows" ("triggerType")`);
    await queryRunner.query(`CREATE INDEX "IDX_workflow_executions_workflow" ON "workflow_executions" ("workflowId")`);
    await queryRunner.query(`CREATE INDEX "IDX_workflow_executions_status" ON "workflow_executions" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_workflow_bindings_workflow" ON "workflow_bindings" ("workflowId")`);
    await queryRunner.query(`CREATE INDEX "IDX_workflow_bindings_entity" ON "workflow_bindings" ("entityType", "entityId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key from lifecycle_webhooks
    await queryRunner.query(`
      ALTER TABLE lifecycle_webhooks
      DROP CONSTRAINT IF EXISTS fk_lifecycle_webhooks_workflow
    `);

    // Remove columns from lifecycle_webhooks
    await queryRunner.query(`
      ALTER TABLE lifecycle_webhooks 
      DROP COLUMN IF EXISTS execution_type,
      DROP COLUMN IF EXISTS workflow_id,
      DROP COLUMN IF EXISTS execution_mode
    `);

    // Drop tables
    await queryRunner.dropTable('workflow_documents', true);
    await queryRunner.dropTable('ai_models', true);
    await queryRunner.dropTable('workflow_bindings', true);
    await queryRunner.dropTable('workflow_executions', true);
    await queryRunner.dropTable('ai_workflows', true);
  }
}