import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultSystemAttributes1753700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First let's check what columns exist in the table
    const columns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'attribute_definitions'
    `);

    const columnNames = columns.map((col: any) => col.column_name);
    console.log('Existing columns:', columnNames);

    // Add missing columns if needed
    if (!columnNames.includes('is_system')) {
      await queryRunner.query(`
        ALTER TABLE attribute_definitions 
        ADD COLUMN is_system BOOLEAN DEFAULT false
      `);
    }

    if (!columnNames.includes('is_required')) {
      await queryRunner.query(`
        ALTER TABLE attribute_definitions 
        ADD COLUMN is_required BOOLEAN DEFAULT false
      `);
    }

    // Add default system attributes for resource scoping
    const systemAttributes = [
      {
        key: 'organizationId',
        name: 'Organization ID',
        category: 'resource',
        type: 'string',
        dataType: 'string',
        description: 'The ID of the organization that owns this resource',
        isSystem: true,
        isRequired: false,
      },
      {
        key: 'departmentId',
        name: 'Department ID',
        category: 'resource',
        type: 'string',
        dataType: 'string',
        description: 'The ID of the department that owns this resource',
        isSystem: true,
        isRequired: false,
      },
      {
        key: 'ownerId',
        name: 'Owner ID',
        category: 'resource',
        type: 'string',
        dataType: 'string',
        description: 'The ID of the user who owns this resource',
        isSystem: true,
        isRequired: false,
      },
      {
        key: 'createdBy',
        name: 'Created By',
        category: 'resource',
        type: 'string',
        dataType: 'string',
        description: 'The ID of the user who created this resource',
        isSystem: true,
        isRequired: false,
      },
      {
        key: 'teamId',
        name: 'Team ID',
        category: 'resource',
        type: 'string',
        dataType: 'string',
        description: 'The ID of the team that owns this resource',
        isSystem: true,
        isRequired: false,
      },
      {
        key: 'projectId',
        name: 'Project ID',
        category: 'resource',
        type: 'string',
        dataType: 'string',
        description: 'The ID of the project this resource belongs to',
        isSystem: true,
        isRequired: false,
      },
      {
        key: 'visibility',
        name: 'Visibility',
        category: 'resource',
        type: 'string',
        dataType: 'string',
        description: 'The visibility level of the resource (public, private, organization, team)',
        isSystem: true,
        isRequired: false,
        allowedValues: ['public', 'private', 'organization', 'team', 'department'],
      },
      {
        key: 'status',
        name: 'Status',
        category: 'resource',
        type: 'string',
        dataType: 'string',
        description: 'The status of the resource',
        isSystem: true,
        isRequired: false,
      },
      {
        key: 'tags',
        name: 'Tags',
        category: 'resource',
        type: 'array',
        dataType: 'array',
        description: 'Tags associated with the resource',
        isSystem: true,
        isRequired: false,
      },
      {
        key: 'region',
        name: 'Region',
        category: 'resource',
        type: 'string',
        dataType: 'string',
        description: 'The geographic region of the resource',
        isSystem: true,
        isRequired: false,
      },
    ];

    // Insert system attributes
    for (const attr of systemAttributes) {
      const existingAttr = await queryRunner.query(
        `SELECT id FROM attribute_definitions WHERE key = $1`,
        [attr.key],
      );

      if (existingAttr.length === 0) {
        // Build dynamic insert based on available columns
        const insertColumns = ['id', 'key', 'name', 'category', 'type', 'data_type'];
        const insertValues = ['gen_random_uuid()', '$1', '$2', '$3', '$4', '$5'];
        const params: any[] = [attr.key, attr.name, attr.category, attr.type, attr.dataType];

        let paramIndex = 6;

        if (attr.description) {
          insertColumns.push('description');
          insertValues.push(`$${paramIndex}`);
          params.push(attr.description);
          paramIndex++;
        }

        if (columnNames.includes('is_system')) {
          insertColumns.push('is_system');
          insertValues.push(`$${paramIndex}`);
          params.push(attr.isSystem);
          paramIndex++;
        }

        if (columnNames.includes('is_required')) {
          insertColumns.push('is_required');
          insertValues.push(`$${paramIndex}`);
          params.push(attr.isRequired);
          paramIndex++;
        }

        if (attr.allowedValues && columnNames.includes('allowed_values')) {
          insertColumns.push('allowed_values');
          insertValues.push(`$${paramIndex}`);
          params.push(JSON.stringify(attr.allowedValues));
          paramIndex++;
        }

        if (columnNames.includes('createdAt')) {
          insertColumns.push('"createdAt"', '"updatedAt"');
          insertValues.push('NOW()', 'NOW()');
        }

        await queryRunner.query(
          `INSERT INTO attribute_definitions (${insertColumns.join(', ')}) 
           VALUES (${insertValues.join(', ')})`,
          params,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove system attributes
    await queryRunner.query(
      `DELETE FROM attribute_definitions WHERE is_system = true AND key IN (
        'organizationId', 'departmentId', 'ownerId', 'createdBy', 
        'teamId', 'projectId', 'visibility', 'status', 'tags', 'region'
      )`,
    );
  }
}
