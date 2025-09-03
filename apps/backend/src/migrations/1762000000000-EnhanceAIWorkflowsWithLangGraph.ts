import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class EnhanceAIWorkflowsWithLangGraph1762000000000 implements MigrationInterface {
  name = 'EnhanceAIWorkflowsWithLangGraph1762000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Note: pgvector extension would be ideal for vector similarity search,
    // but we'll use JSONB for compatibility with standard PostgreSQL
    // To enable pgvector in the future, install the extension manually:
    // CREATE EXTENSION vector;
    
    // Add new columns to existing ai_workflows table
    await queryRunner.addColumn('ai_workflows', new TableColumn({
      name: 'category',
      type: 'varchar',
      length: '50',
      isNullable: true,
      comment: 'Workflow category (chat, agent, rag, automation, etc.)'
    }));

    await queryRunner.addColumn('ai_workflows', new TableColumn({
      name: 'tags',
      type: 'text',
      isArray: true,
      isNullable: true,
      default: "'{}'",
      comment: 'Tags for workflow categorization'
    }));

    await queryRunner.addColumn('ai_workflows', new TableColumn({
      name: 'flowState',
      type: 'jsonb',
      isNullable: true,
      comment: 'Shared state across workflow nodes'
    }));

    await queryRunner.addColumn('ai_workflows', new TableColumn({
      name: 'variables',
      type: 'jsonb',
      isNullable: true,
      comment: 'Global workflow variables'
    }));

    await queryRunner.addColumn('ai_workflows', new TableColumn({
      name: 'chatbotConfig',
      type: 'jsonb',
      isNullable: true,
      comment: 'Configuration for chatbot interface'
    }));

    // Create workflow templates table
    await queryRunner.createTable(new Table({
      name: 'workflow_templates',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'uuid'
        },
        {
          name: 'name',
          type: 'varchar',
          length: '255'
        },
        {
          name: 'description',
          type: 'text',
          isNullable: true
        },
        {
          name: 'category',
          type: 'varchar',
          length: '50'
        },
        {
          name: 'tags',
          type: 'text',
          isArray: true,
          default: "'{}'",
        },
        {
          name: 'icon',
          type: 'varchar',
          length: '100',
          isNullable: true
        },
        {
          name: 'flowDefinition',
          type: 'jsonb',
          comment: 'Template workflow definition'
        },
        {
          name: 'inputSchema',
          type: 'jsonb',
          isNullable: true
        },
        {
          name: 'outputSchema',
          type: 'jsonb',
          isNullable: true
        },
        {
          name: 'requiredCredentials',
          type: 'jsonb',
          isNullable: true,
          comment: 'List of required credential types'
        },
        {
          name: 'isPublic',
          type: 'boolean',
          default: false
        },
        {
          name: 'usageCount',
          type: 'int',
          default: 0
        },
        {
          name: 'organizationId',
          type: 'uuid',
          isNullable: true,
          comment: 'Organization that owns this template'
        },
        {
          name: 'createdById',
          type: 'uuid',
          isNullable: true
        },
        {
          name: 'metadata',
          type: 'jsonb',
          isNullable: true
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP'
        },
        {
          name: 'updatedAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP'
        }
      ]
    }), true);

    // Create workflow versions table
    await queryRunner.createTable(new Table({
      name: 'workflow_versions',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'uuid'
        },
        {
          name: 'workflowId',
          type: 'uuid'
        },
        {
          name: 'version',
          type: 'int'
        },
        {
          name: 'flowDefinition',
          type: 'jsonb'
        },
        {
          name: 'changeLog',
          type: 'text',
          isNullable: true
        },
        {
          name: 'createdById',
          type: 'uuid',
          isNullable: true
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP'
        }
      ]
    }), true);

    // Create workflow credentials table
    await queryRunner.createTable(new Table({
      name: 'workflow_credentials',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'uuid'
        },
        {
          name: 'organizationId',
          type: 'uuid'
        },
        {
          name: 'name',
          type: 'varchar',
          length: '255'
        },
        {
          name: 'credentialType',
          type: 'varchar',
          length: '100',
          comment: 'Type of credential (openai, anthropic, pinecone, etc.)'
        },
        {
          name: 'encryptedData',
          type: 'text',
          comment: 'Encrypted credential data'
        },
        {
          name: 'metadata',
          type: 'jsonb',
          isNullable: true
        },
        {
          name: 'createdById',
          type: 'uuid',
          isNullable: true
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP'
        },
        {
          name: 'updatedAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP'
        }
      ]
    }), true);

    // Create vector embeddings table for RAG
    await queryRunner.createTable(new Table({
      name: 'vector_embeddings',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'uuid'
        },
        {
          name: 'organizationId',
          type: 'uuid'
        },
        {
          name: 'workflowId',
          type: 'uuid',
          isNullable: true
        },
        {
          name: 'documentId',
          type: 'uuid',
          isNullable: true
        },
        {
          name: 'content',
          type: 'text'
        },
        {
          name: 'embedding',
          type: 'jsonb', // Changed from vector to jsonb for compatibility
          isNullable: true,
          comment: 'Vector embedding for similarity search (stored as JSON array)'
        },
        {
          name: 'metadata',
          type: 'jsonb',
          isNullable: true,
          comment: 'Additional metadata for filtering'
        },
        {
          name: 'chunkIndex',
          type: 'int',
          isNullable: true
        },
        {
          name: 'totalChunks',
          type: 'int',
          isNullable: true
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP'
        }
      ]
    }), true);

    // Create conversation history table
    await queryRunner.createTable(new Table({
      name: 'conversation_history',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'uuid'
        },
        {
          name: 'sessionId',
          type: 'varchar',
          length: '255'
        },
        {
          name: 'workflowId',
          type: 'uuid'
        },
        {
          name: 'organizationId',
          type: 'uuid'
        },
        {
          name: 'userId',
          type: 'uuid',
          isNullable: true
        },
        {
          name: 'role',
          type: 'varchar',
          length: '20',
          comment: 'user, assistant, system, function'
        },
        {
          name: 'content',
          type: 'text'
        },
        {
          name: 'metadata',
          type: 'jsonb',
          isNullable: true,
          comment: 'Token count, model used, etc.'
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP'
        }
      ]
    }), true);

    // Create workflow metrics table
    await queryRunner.createTable(new Table({
      name: 'workflow_metrics',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'uuid'
        },
        {
          name: 'workflowId',
          type: 'uuid'
        },
        {
          name: 'executionId',
          type: 'uuid',
          isNullable: true
        },
        {
          name: 'metricType',
          type: 'varchar',
          length: '50',
          comment: 'token_usage, latency, cost, error_rate'
        },
        {
          name: 'value',
          type: 'decimal',
          precision: 10,
          scale: 4
        },
        {
          name: 'unit',
          type: 'varchar',
          length: '20',
          isNullable: true
        },
        {
          name: 'nodeId',
          type: 'varchar',
          length: '100',
          isNullable: true,
          comment: 'Specific node that generated this metric'
        },
        {
          name: 'metadata',
          type: 'jsonb',
          isNullable: true
        },
        {
          name: 'timestamp',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP'
        }
      ]
    }), true);

    // Create tool definitions table
    await queryRunner.createTable(new Table({
      name: 'workflow_tools',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'uuid'
        },
        {
          name: 'organizationId',
          type: 'uuid'
        },
        {
          name: 'name',
          type: 'varchar',
          length: '255'
        },
        {
          name: 'description',
          type: 'text',
          isNullable: true
        },
        {
          name: 'toolType',
          type: 'varchar',
          length: '50',
          comment: 'api, function, browser, calculator, etc.'
        },
        {
          name: 'definition',
          type: 'jsonb',
          comment: 'Tool configuration and parameters'
        },
        {
          name: 'isActive',
          type: 'boolean',
          default: true
        },
        {
          name: 'metadata',
          type: 'jsonb',
          isNullable: true
        },
        {
          name: 'createdById',
          type: 'uuid',
          isNullable: true
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP'
        },
        {
          name: 'updatedAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP'
        }
      ]
    }), true);

    // Add memory storage table for conversation memory
    await queryRunner.createTable(new Table({
      name: 'workflow_memory',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'uuid'
        },
        {
          name: 'sessionId',
          type: 'varchar',
          length: '255'
        },
        {
          name: 'workflowId',
          type: 'uuid'
        },
        {
          name: 'memoryType',
          type: 'varchar',
          length: '50',
          comment: 'buffer, summary, entity, vector'
        },
        {
          name: 'memoryData',
          type: 'jsonb'
        },
        {
          name: 'metadata',
          type: 'jsonb',
          isNullable: true
        },
        {
          name: 'expiresAt',
          type: 'timestamp',
          isNullable: true
        },
        {
          name: 'createdAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP'
        },
        {
          name: 'updatedAt',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP'
        }
      ]
    }), true);

    // Add foreign keys
    await queryRunner.createForeignKey('workflow_templates', new TableForeignKey({
      columnNames: ['organizationId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE'
    }));

    await queryRunner.createForeignKey('workflow_templates', new TableForeignKey({
      columnNames: ['createdById'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'SET NULL'
    }));

    await queryRunner.createForeignKey('workflow_versions', new TableForeignKey({
      columnNames: ['workflowId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'ai_workflows',
      onDelete: 'CASCADE'
    }));

    await queryRunner.createForeignKey('workflow_versions', new TableForeignKey({
      columnNames: ['createdById'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'SET NULL'
    }));

    await queryRunner.createForeignKey('workflow_credentials', new TableForeignKey({
      columnNames: ['organizationId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE'
    }));

    await queryRunner.createForeignKey('workflow_credentials', new TableForeignKey({
      columnNames: ['createdById'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'SET NULL'
    }));

    await queryRunner.createForeignKey('vector_embeddings', new TableForeignKey({
      columnNames: ['organizationId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE'
    }));

    await queryRunner.createForeignKey('vector_embeddings', new TableForeignKey({
      columnNames: ['workflowId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'ai_workflows',
      onDelete: 'CASCADE'
    }));

    await queryRunner.createForeignKey('vector_embeddings', new TableForeignKey({
      columnNames: ['documentId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'workflow_documents',
      onDelete: 'CASCADE'
    }));

    await queryRunner.createForeignKey('conversation_history', new TableForeignKey({
      columnNames: ['workflowId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'ai_workflows',
      onDelete: 'CASCADE'
    }));

    await queryRunner.createForeignKey('conversation_history', new TableForeignKey({
      columnNames: ['organizationId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE'
    }));

    await queryRunner.createForeignKey('conversation_history', new TableForeignKey({
      columnNames: ['userId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'SET NULL'
    }));

    await queryRunner.createForeignKey('workflow_metrics', new TableForeignKey({
      columnNames: ['workflowId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'ai_workflows',
      onDelete: 'CASCADE'
    }));

    await queryRunner.createForeignKey('workflow_metrics', new TableForeignKey({
      columnNames: ['executionId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'workflow_executions',
      onDelete: 'CASCADE'
    }));

    await queryRunner.createForeignKey('workflow_tools', new TableForeignKey({
      columnNames: ['organizationId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'organizations',
      onDelete: 'CASCADE'
    }));

    await queryRunner.createForeignKey('workflow_tools', new TableForeignKey({
      columnNames: ['createdById'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'SET NULL'
    }));

    await queryRunner.createForeignKey('workflow_memory', new TableForeignKey({
      columnNames: ['workflowId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'ai_workflows',
      onDelete: 'CASCADE'
    }));

    // Create indexes for performance
    await queryRunner.createIndex('workflow_templates', new TableIndex({
      name: 'IDX_workflow_templates_category',
      columnNames: ['category']
    }));

    await queryRunner.createIndex('workflow_templates', new TableIndex({
      name: 'IDX_workflow_templates_public',
      columnNames: ['isPublic']
    }));

    await queryRunner.createIndex('workflow_versions', new TableIndex({
      name: 'IDX_workflow_versions_workflow',
      columnNames: ['workflowId', 'version']
    }));

    await queryRunner.createIndex('workflow_credentials', new TableIndex({
      name: 'IDX_workflow_credentials_org_type',
      columnNames: ['organizationId', 'credentialType']
    }));

    await queryRunner.createIndex('vector_embeddings', new TableIndex({
      name: 'IDX_vector_embeddings_org_workflow',
      columnNames: ['organizationId', 'workflowId']
    }));

    await queryRunner.createIndex('conversation_history', new TableIndex({
      name: 'IDX_conversation_history_session',
      columnNames: ['sessionId']
    }));

    await queryRunner.createIndex('conversation_history', new TableIndex({
      name: 'IDX_conversation_history_workflow',
      columnNames: ['workflowId']
    }));

    await queryRunner.createIndex('workflow_metrics', new TableIndex({
      name: 'IDX_workflow_metrics_workflow_type',
      columnNames: ['workflowId', 'metricType']
    }));

    await queryRunner.createIndex('workflow_memory', new TableIndex({
      name: 'IDX_workflow_memory_session',
      columnNames: ['sessionId']
    }));

    await queryRunner.createIndex('ai_workflows', new TableIndex({
      name: 'IDX_ai_workflows_category',
      columnNames: ['category']
    }));

    // Create GIN index for JSONB embedding column for better performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vector_embeddings_embedding 
      ON vector_embeddings 
      USING GIN (embedding)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('ai_workflows', 'IDX_ai_workflows_category');
    await queryRunner.dropIndex('workflow_memory', 'IDX_workflow_memory_session');
    await queryRunner.dropIndex('workflow_metrics', 'IDX_workflow_metrics_workflow_type');
    await queryRunner.dropIndex('conversation_history', 'IDX_conversation_history_workflow');
    await queryRunner.dropIndex('conversation_history', 'IDX_conversation_history_session');
    await queryRunner.dropIndex('vector_embeddings', 'IDX_vector_embeddings_org_workflow');
    await queryRunner.dropIndex('workflow_credentials', 'IDX_workflow_credentials_org_type');
    await queryRunner.dropIndex('workflow_versions', 'IDX_workflow_versions_workflow');
    await queryRunner.dropIndex('workflow_templates', 'IDX_workflow_templates_public');
    await queryRunner.dropIndex('workflow_templates', 'IDX_workflow_templates_category');

    // Drop tables
    await queryRunner.dropTable('workflow_memory', true);
    await queryRunner.dropTable('workflow_tools', true);
    await queryRunner.dropTable('workflow_metrics', true);
    await queryRunner.dropTable('conversation_history', true);
    await queryRunner.dropTable('vector_embeddings', true);
    await queryRunner.dropTable('workflow_credentials', true);
    await queryRunner.dropTable('workflow_versions', true);
    await queryRunner.dropTable('workflow_templates', true);

    // Drop columns from ai_workflows
    await queryRunner.dropColumn('ai_workflows', 'chatbotConfig');
    await queryRunner.dropColumn('ai_workflows', 'variables');
    await queryRunner.dropColumn('ai_workflows', 'flowState');
    await queryRunner.dropColumn('ai_workflows', 'tags');
    await queryRunner.dropColumn('ai_workflows', 'category');
  }
}