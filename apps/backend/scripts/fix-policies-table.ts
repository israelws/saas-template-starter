import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.dev') });

async function fixPoliciesTable() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'saas_template',
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully');

    // Check current table structure
    console.log('\nChecking current policies table structure...');
    const checkQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'policies'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const currentColumns = await client.query(checkQuery);
    console.log('Current columns:');
    currentColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
    });

    // Check which columns are missing
    const existingColumns = currentColumns.rows.map(row => row.column_name);
    const requiredColumns = ['subjects', 'resources', 'actions', 'conditions'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length === 0) {
      console.log('\nAll required columns already exist!');
      return;
    }

    console.log(`\nMissing columns: ${missingColumns.join(', ')}`);
    console.log('Adding missing columns...');

    // Add missing columns
    for (const column of missingColumns) {
      let alterQuery = '';
      
      switch (column) {
        case 'subjects':
          alterQuery = `
            ALTER TABLE policies 
            ADD COLUMN IF NOT EXISTS subjects JSONB NOT NULL DEFAULT '{}'::jsonb;
          `;
          break;
        case 'resources':
          alterQuery = `
            ALTER TABLE policies 
            ADD COLUMN IF NOT EXISTS resources JSONB NOT NULL DEFAULT '{}'::jsonb;
          `;
          break;
        case 'actions':
          alterQuery = `
            ALTER TABLE policies 
            ADD COLUMN IF NOT EXISTS actions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
          `;
          break;
        case 'conditions':
          alterQuery = `
            ALTER TABLE policies 
            ADD COLUMN IF NOT EXISTS conditions JSONB;
          `;
          break;
      }

      if (alterQuery) {
        console.log(`\nAdding column: ${column}`);
        await client.query(alterQuery);
        console.log(`✓ Column ${column} added successfully`);
      }
    }

    // Verify the changes
    console.log('\nVerifying changes...');
    const verifyColumns = await client.query(checkQuery);
    console.log('Updated columns:');
    verifyColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
    });

    // Check if there are any existing policies that need default values
    const countQuery = 'SELECT COUNT(*) FROM policies';
    const countResult = await client.query(countQuery);
    const policyCount = parseInt(countResult.rows[0].count);
    
    if (policyCount > 0) {
      console.log(`\nFound ${policyCount} existing policies`);
      console.log('Default values have been applied to new columns');
    } else {
      console.log('\nNo existing policies found');
    }

    console.log('\n✓ Policies table fixed successfully!');

  } catch (error) {
    console.error('Error fixing policies table:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

// Run the fix
fixPoliciesTable()
  .then(() => {
    console.log('\nScript completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });