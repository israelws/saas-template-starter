#!/usr/bin/env tsx

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../..', '.env.local') });

async function fixTransactionsTable() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'saas_template',
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // First check current structure
    console.log('\nChecking current transactions table structure...');
    const columns = await dataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'transactions'
      ORDER BY ordinal_position;
    `);
    
    console.log('Current columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // Add missing columns
    console.log('\nAdding missing columns to transactions table...');
    
    await dataSource.query(`
      ALTER TABLE "transactions" 
      ADD COLUMN IF NOT EXISTS "type" varchar(50),
      ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "currency" varchar(3) DEFAULT 'USD',
      ADD COLUMN IF NOT EXISTS "paymentMethod" varchar(50),
      ADD COLUMN IF NOT EXISTS "referenceNumber" varchar(100),
      ADD COLUMN IF NOT EXISTS "description" text,
      ADD COLUMN IF NOT EXISTS "processedAt" timestamp with time zone,
      ADD COLUMN IF NOT EXISTS "failureReason" text,
      ADD COLUMN IF NOT EXISTS "gatewayResponse" jsonb,
      ADD COLUMN IF NOT EXISTS "metadata" jsonb;
    `);

    // Update amount column type
    await dataSource.query(`
      ALTER TABLE "transactions"
      ALTER COLUMN "amount" TYPE decimal(10,2) USING amount::decimal(10,2);
    `);

    // Create indexes
    console.log('\nCreating indexes...');
    await dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_transactions_organizationId_status" ON "transactions" ("organizationId", "status")`);
    await dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_transactions_customerId" ON "transactions" ("customerId")`);
    await dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_transactions_orderId" ON "transactions" ("orderId")`);
    await dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_transactions_type" ON "transactions" ("type")`);
    await dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_transactions_referenceNumber" ON "transactions" ("referenceNumber")`);

    console.log('\n✅ Transactions table updated successfully!');

    // Verify the changes
    console.log('\nVerifying changes...');
    const updatedColumns = await dataSource.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'transactions'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nUpdated columns:');
    updatedColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    if (error.detail) {
      console.error('Detail:', error.detail);
    }
  } finally {
    await dataSource.destroy();
  }
}

fixTransactionsTable();