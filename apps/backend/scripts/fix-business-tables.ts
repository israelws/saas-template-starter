#!/usr/bin/env tsx

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../..', '.env.local') });

async function fixBusinessTables() {
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

    // Update products table
    console.log('\nUpdating products table...');
    await dataSource.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "category" varchar(255),
      ADD COLUMN IF NOT EXISTS "type" varchar(50) DEFAULT 'physical',
      ADD COLUMN IF NOT EXISTS "currency" varchar(3) DEFAULT 'USD',
      ADD COLUMN IF NOT EXISTS "metadata" jsonb,
      ADD COLUMN IF NOT EXISTS "inventory" jsonb;
    `);

    await dataSource.query(`
      ALTER TABLE "products"
      ALTER COLUMN "price" TYPE decimal(10,2) USING price::decimal(10,2),
      ALTER COLUMN "status" TYPE varchar(50) USING status::varchar(50);
    `);

    // Update customers table
    console.log('\nUpdating customers table...');
    await dataSource.query(`
      ALTER TABLE "customers" 
      ADD COLUMN IF NOT EXISTS "type" varchar(50) DEFAULT 'individual',
      ADD COLUMN IF NOT EXISTS "firstName" varchar(255),
      ADD COLUMN IF NOT EXISTS "lastName" varchar(255),
      ADD COLUMN IF NOT EXISTS "companyName" varchar(255),
      ADD COLUMN IF NOT EXISTS "taxId" varchar(50),
      ADD COLUMN IF NOT EXISTS "contactInfo" jsonb,
      ADD COLUMN IF NOT EXISTS "billingAddress" jsonb,
      ADD COLUMN IF NOT EXISTS "shippingAddress" jsonb,
      ADD COLUMN IF NOT EXISTS "creditLimit" decimal(10,2),
      ADD COLUMN IF NOT EXISTS "currency" varchar(3) DEFAULT 'USD',
      ADD COLUMN IF NOT EXISTS "preferences" jsonb,
      ADD COLUMN IF NOT EXISTS "metadata" jsonb;
    `);

    await dataSource.query(`
      ALTER TABLE "customers"
      ALTER COLUMN "balance" TYPE decimal(10,2) USING balance::decimal(10,2),
      ALTER COLUMN "status" TYPE varchar(50) USING status::varchar(50);
    `);

    // Update orders table
    console.log('\nUpdating orders table...');
    await dataSource.query(`
      ALTER TABLE "orders" 
      ADD COLUMN IF NOT EXISTS "orderDate" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "paymentStatus" varchar(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "billingAddress" jsonb,
      ADD COLUMN IF NOT EXISTS "shippingMethod" varchar(50) DEFAULT 'standard',
      ADD COLUMN IF NOT EXISTS "subtotal" decimal(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "tax" decimal(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "shipping" decimal(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "discount" decimal(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "total" decimal(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "currency" varchar(3) DEFAULT 'USD',
      ADD COLUMN IF NOT EXISTS "metadata" jsonb;
    `);

    await dataSource.query(`
      ALTER TABLE "orders"
      ALTER COLUMN "status" TYPE varchar(50) USING status::varchar(50);
    `);

    // Update order_items table
    console.log('\nUpdating order_items table...');
    await dataSource.query(`
      ALTER TABLE "order_items" 
      ADD COLUMN IF NOT EXISTS "discount" decimal(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "tax" decimal(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "total" decimal(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "notes" text,
      ADD COLUMN IF NOT EXISTS "metadata" jsonb;
    `);

    await dataSource.query(`
      ALTER TABLE "order_items"
      ALTER COLUMN "unitPrice" TYPE decimal(10,2) USING "unitPrice"::decimal(10,2);
    `);

    // Create indexes
    console.log('\nCreating indexes...');
    await dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_orderDate" ON "orders" ("orderDate")`);
    await dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_products_category" ON "products" ("category")`);
    await dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_customers_type" ON "customers" ("type")`);

    console.log('\n✅ All tables updated successfully!');

    // Verify the changes
    console.log('\nVerifying changes...');
    const tables = ['products', 'customers', 'orders', 'order_items'];
    
    for (const table of tables) {
      const columns = await dataSource.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);
      
      console.log(`\nTable ${table}:`);
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.detail) {
      console.error('Detail:', error.detail);
    }
  } finally {
    await dataSource.destroy();
  }
}

fixBusinessTables();