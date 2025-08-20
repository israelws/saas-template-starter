import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddLifecycleWebhooks1755701916275 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create lifecycle_webhooks table
    await queryRunner.createTable(
      new Table({
        name: 'lifecycle_webhooks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'lifecycleEventId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'method',
            type: 'varchar',
            length: '10',
            default: "'POST'",
          },
          {
            name: 'headers',
            type: 'jsonb',
            isNullable: true,
            comment: 'Custom headers to send with the webhook',
          },
          {
            name: 'authType',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Authentication type: bearer, basic, api-key, custom',
          },
          {
            name: 'authConfig',
            type: 'jsonb',
            isNullable: true,
            comment: 'Encrypted authentication configuration',
          },
          {
            name: 'retryConfig',
            type: 'jsonb',
            isNullable: true,
            default: "'{\"maxRetries\": 3, \"retryDelay\": 1000, \"backoffMultiplier\": 2}'",
            comment: 'Retry configuration for failed webhook calls',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'includeContext',
            type: 'boolean',
            default: true,
            comment: 'Include task context in webhook payload',
          },
          {
            name: 'includeAuth',
            type: 'boolean',
            default: true,
            comment: 'Include authorization info in webhook payload',
          },
          {
            name: 'customPayload',
            type: 'jsonb',
            isNullable: true,
            comment: 'Custom payload template to merge with event data',
          },
          {
            name: 'lastTriggeredAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lastStatus',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Last webhook execution status',
          },
          {
            name: 'lastError',
            type: 'text',
            isNullable: true,
            comment: 'Last error message if webhook failed',
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
      }),
      true,
    );

    // Add foreign key for lifecycleEventId
    await queryRunner.createForeignKey(
      'lifecycle_webhooks',
      new TableForeignKey({
        columnNames: ['lifecycleEventId'],
        referencedTableName: 'task_lifecycle_events',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Create webhook_logs table for tracking webhook execution history
    await queryRunner.createTable(
      new Table({
        name: 'webhook_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'webhookId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'taskId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'eventType',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'method',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'requestHeaders',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'requestBody',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'responseStatus',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'responseHeaders',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'responseBody',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'duration',
            type: 'integer',
            isNullable: true,
            comment: 'Request duration in milliseconds',
          },
          {
            name: 'retryCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'success',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key for webhookId
    await queryRunner.createForeignKey(
      'webhook_logs',
      new TableForeignKey({
        columnNames: ['webhookId'],
        referencedTableName: 'lifecycle_webhooks',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Add foreign key for taskId
    await queryRunner.createForeignKey(
      'webhook_logs',
      new TableForeignKey({
        columnNames: ['taskId'],
        referencedTableName: 'tasks',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    // Create indexes
    await queryRunner.query(`CREATE INDEX idx_lifecycle_webhooks_event ON lifecycle_webhooks("lifecycleEventId")`);
    await queryRunner.query(`CREATE INDEX idx_lifecycle_webhooks_active ON lifecycle_webhooks("isActive")`);
    await queryRunner.query(`CREATE INDEX idx_webhook_logs_webhook ON webhook_logs("webhookId")`);
    await queryRunner.query(`CREATE INDEX idx_webhook_logs_task ON webhook_logs("taskId")`);
    await queryRunner.query(`CREATE INDEX idx_webhook_logs_created ON webhook_logs("createdAt" DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX idx_webhook_logs_created`);
    await queryRunner.query(`DROP INDEX idx_webhook_logs_task`);
    await queryRunner.query(`DROP INDEX idx_webhook_logs_webhook`);
    await queryRunner.query(`DROP INDEX idx_lifecycle_webhooks_active`);
    await queryRunner.query(`DROP INDEX idx_lifecycle_webhooks_event`);

    // Drop webhook_logs table
    await queryRunner.dropTable('webhook_logs');

    // Drop lifecycle_webhooks table
    await queryRunner.dropTable('lifecycle_webhooks');
  }
}
