import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBusinessObjectTables1753000000000 implements MigrationInterface {
  name = 'UpdateBusinessObjectTables1753000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update products table
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN IF NOT EXISTS "category" varchar(255),
      ADD COLUMN IF NOT EXISTS "type" varchar(50) DEFAULT 'physical',
      ADD COLUMN IF NOT EXISTS "currency" varchar(3) DEFAULT 'USD',
      ADD COLUMN IF NOT EXISTS "metadata" jsonb,
      ADD COLUMN IF NOT EXISTS "inventory" jsonb;
      
      ALTER TABLE "products"
      ALTER COLUMN "price" TYPE decimal(10,2),
      ALTER COLUMN "status" TYPE varchar(50);
    `);

    // Update customers table
    await queryRunner.query(`
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
      
      ALTER TABLE "customers"
      ALTER COLUMN "balance" TYPE decimal(10,2),
      ALTER COLUMN "status" TYPE varchar(50);
    `);

    // Update orders table
    await queryRunner.query(`
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
      
      ALTER TABLE "orders"
      ALTER COLUMN "status" TYPE varchar(50);
    `);

    // Update order_items table
    await queryRunner.query(`
      ALTER TABLE "order_items" 
      ADD COLUMN IF NOT EXISTS "discount" decimal(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "tax" decimal(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "total" decimal(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "notes" text,
      ADD COLUMN IF NOT EXISTS "metadata" jsonb;
      
      ALTER TABLE "order_items"
      ALTER COLUMN "unitPrice" TYPE decimal(10,2);
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_orderDate" ON "orders" ("orderDate")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_category" ON "products" ("category")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_customers_type" ON "customers" ("type")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_orderDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customers_type"`);

    // Note: We don't drop columns in down migration to prevent data loss
    // If needed, create a separate migration to remove columns after backing up data
  }
}