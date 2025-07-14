import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.dev') });

async function checkMigrations() {
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
    
    // Check migrations
    const result = await client.query('SELECT * FROM migrations ORDER BY id DESC LIMIT 10');
    console.log('\nLatest migrations:');
    result.rows.forEach(row => {
      console.log(`${row.id}: ${row.name} - ${row.timestamp}`);
    });
    
    // Check if our migration exists
    const fixMigration = await client.query(`
      SELECT * FROM migrations WHERE name LIKE '%FixPolicyTableSchema%'
    `);
    
    if (fixMigration.rows.length > 0) {
      console.log('\nFixPolicyTableSchema migration found:');
      console.log(fixMigration.rows[0]);
      
      // Delete it so we can re-run
      await client.query(`DELETE FROM migrations WHERE name LIKE '%FixPolicyTableSchema%'`);
      console.log('Deleted migration record to allow re-run');
    } else {
      console.log('\nFixPolicyTableSchema migration not found in database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkMigrations();