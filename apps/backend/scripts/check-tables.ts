#!/usr/bin/env tsx

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../..', '.env.local') });

async function checkTables() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'saas_template',
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Check if tables exist
    const tables = ['products', 'customers', 'orders', 'order_items'];
    
    for (const table of tables) {
      const result = await dataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      console.log(`Table ${table}: ${result[0].exists ? 'EXISTS' : 'DOES NOT EXIST'}`);
      
      if (result[0].exists) {
        // Get column names
        const columns = await dataSource.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position;
        `, [table]);
        
        console.log(`  Columns: ${columns.map(c => c.column_name).join(', ')}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await dataSource.destroy();
  }
}

checkTables();