import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1704000000000 implements MigrationInterface {
  name = 'InitialSchema1704000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create organizations table with closure table
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "code" character varying NOT NULL,
        "description" text,
        "type" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'active',
        "settings" jsonb DEFAULT '{}',
        "parentId" uuid,
        CONSTRAINT "UQ_organizations_code" UNIQUE ("code"),
        CONSTRAINT "PK_organizations" PRIMARY KEY ("id")
      )
    `);

    // Create organization closure table for hierarchical queries
    await queryRunner.query(`
      CREATE TABLE "organization_closure" (
        "id_ancestor" uuid NOT NULL,
        "id_descendant" uuid NOT NULL,
        CONSTRAINT "PK_organization_closure" PRIMARY KEY ("id_ancestor", "id_descendant")
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "cognitoId" character varying NOT NULL,
        "email" character varying NOT NULL,
        "firstName" character varying,
        "lastName" character varying,
        "status" character varying NOT NULL DEFAULT 'active',
        "attributes" jsonb DEFAULT '{}',
        CONSTRAINT "UQ_users_cognitoId" UNIQUE ("cognitoId"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create user organization memberships table
    await queryRunner.query(`
      CREATE TABLE "user_organization_memberships" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "userId" uuid NOT NULL,
        "organizationId" uuid NOT NULL,
        "role" character varying NOT NULL,
        "attributes" jsonb DEFAULT '{}',
        "startDate" TIMESTAMP,
        "endDate" TIMESTAMP,
        CONSTRAINT "UQ_user_org_membership" UNIQUE ("userId", "organizationId"),
        CONSTRAINT "PK_user_organization_memberships" PRIMARY KEY ("id")
      )
    `);

    // Create attribute definitions table
    await queryRunner.query(`
      CREATE TABLE "attribute_definitions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "key" character varying NOT NULL,
        "type" character varying NOT NULL,
        "category" character varying NOT NULL,
        "description" text,
        "required" boolean NOT NULL DEFAULT false,
        "defaultValue" jsonb,
        "validationRules" jsonb DEFAULT '{}',
        "organizationId" uuid,
        CONSTRAINT "UQ_attribute_key_org" UNIQUE ("key", "organizationId"),
        CONSTRAINT "PK_attribute_definitions" PRIMARY KEY ("id")
      )
    `);

    // Create policy sets table
    await queryRunner.query(`
      CREATE TABLE "policy_sets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "description" text,
        "priority" integer NOT NULL DEFAULT 50,
        "status" character varying NOT NULL DEFAULT 'active',
        "organizationId" uuid,
        CONSTRAINT "PK_policy_sets" PRIMARY KEY ("id")
      )
    `);

    // Create policies table
    await queryRunner.query(`
      CREATE TABLE "policies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "description" text,
        "resource" character varying NOT NULL,
        "action" character varying NOT NULL,
        "effect" character varying NOT NULL,
        "conditions" jsonb DEFAULT '{}',
        "priority" integer NOT NULL DEFAULT 50,
        "status" character varying NOT NULL DEFAULT 'active',
        "organizationId" uuid,
        "policySetId" uuid,
        CONSTRAINT "PK_policies" PRIMARY KEY ("id")
      )
    `);

    // Create products table
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "description" text,
        "sku" character varying NOT NULL,
        "price" decimal(10,2) NOT NULL,
        "stockQuantity" integer NOT NULL DEFAULT 0,
        "status" character varying NOT NULL DEFAULT 'active',
        "attributes" jsonb DEFAULT '{}',
        "organizationId" uuid NOT NULL,
        CONSTRAINT "UQ_product_sku_org" UNIQUE ("sku", "organizationId"),
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )
    `);

    // Create customers table
    await queryRunner.query(`
      CREATE TABLE "customers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL,
        "phone" character varying,
        "address" text,
        "balance" decimal(10,2) NOT NULL DEFAULT 0,
        "status" character varying NOT NULL DEFAULT 'active',
        "attributes" jsonb DEFAULT '{}',
        "organizationId" uuid NOT NULL,
        CONSTRAINT "PK_customers" PRIMARY KEY ("id")
      )
    `);

    // Create orders table
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "orderNumber" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "totalAmount" decimal(10,2) NOT NULL,
        "paymentStatus" character varying NOT NULL DEFAULT 'pending',
        "shippingAddress" text,
        "notes" text,
        "organizationId" uuid NOT NULL,
        "customerId" uuid NOT NULL,
        CONSTRAINT "UQ_order_number" UNIQUE ("orderNumber"),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id")
      )
    `);

    // Create order items table
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "quantity" integer NOT NULL,
        "unitPrice" decimal(10,2) NOT NULL,
        "totalPrice" decimal(10,2) NOT NULL,
        "orderId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id")
      )
    `);

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "type" character varying NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "referenceNumber" character varying NOT NULL,
        "description" text,
        "metadata" jsonb DEFAULT '{}',
        "balanceAfter" decimal(10,2) NOT NULL,
        "organizationId" uuid NOT NULL,
        "customerId" uuid NOT NULL,
        "orderId" uuid,
        CONSTRAINT "UQ_reference_number" UNIQUE ("referenceNumber"),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_organizations_parentId" ON "organizations" ("parentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_organization_closure_ancestor" ON "organization_closure" ("id_ancestor")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_organization_closure_descendant" ON "organization_closure" ("id_descendant")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_cognitoId" ON "users" ("cognitoId")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_memberships_userId" ON "user_organization_memberships" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_memberships_organizationId" ON "user_organization_memberships" ("organizationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_policies_organizationId" ON "policies" ("organizationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_policies_resource_action" ON "policies" ("resource", "action")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_organizationId" ON "products" ("organizationId")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_products_sku" ON "products" ("sku")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_customers_organizationId" ON "customers" ("organizationId")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_customers_email" ON "customers" ("email")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_organizationId" ON "orders" ("organizationId")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_orders_customerId" ON "orders" ("customerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_order_items_orderId" ON "order_items" ("orderId")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_organizationId" ON "transactions" ("organizationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_customerId" ON "transactions" ("customerId")`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD CONSTRAINT "FK_organizations_parent" FOREIGN KEY ("parentId") REFERENCES "organizations"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_closure" ADD CONSTRAINT "FK_closure_ancestor" FOREIGN KEY ("id_ancestor") REFERENCES "organizations"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_closure" ADD CONSTRAINT "FK_closure_descendant" FOREIGN KEY ("id_descendant") REFERENCES "organizations"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_organization_memberships" ADD CONSTRAINT "FK_membership_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_organization_memberships" ADD CONSTRAINT "FK_membership_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "attribute_definitions" ADD CONSTRAINT "FK_attribute_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "policy_sets" ADD CONSTRAINT "FK_policy_set_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "policies" ADD CONSTRAINT "FK_policy_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "policies" ADD CONSTRAINT "FK_policy_set" FOREIGN KEY ("policySetId") REFERENCES "policy_sets"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_product_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "customers" ADD CONSTRAINT "FK_customer_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_order_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_order_customer" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_item_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_item_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_transaction_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_transaction_customer" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_transaction_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_transaction_order"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_transaction_customer"`);
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_transaction_organization"`,
    );
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_item_product"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_item_order"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_order_customer"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_order_organization"`);
    await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_customer_organization"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_product_organization"`);
    await queryRunner.query(`ALTER TABLE "policies" DROP CONSTRAINT "FK_policy_set"`);
    await queryRunner.query(`ALTER TABLE "policies" DROP CONSTRAINT "FK_policy_organization"`);
    await queryRunner.query(
      `ALTER TABLE "policy_sets" DROP CONSTRAINT "FK_policy_set_organization"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attribute_definitions" DROP CONSTRAINT "FK_attribute_organization"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_organization_memberships" DROP CONSTRAINT "FK_membership_organization"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_organization_memberships" DROP CONSTRAINT "FK_membership_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_closure" DROP CONSTRAINT "FK_closure_descendant"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_closure" DROP CONSTRAINT "FK_closure_ancestor"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP CONSTRAINT "FK_organizations_parent"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_transactions_customerId"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_organizationId"`);
    await queryRunner.query(`DROP INDEX "IDX_order_items_orderId"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_customerId"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_organizationId"`);
    await queryRunner.query(`DROP INDEX "IDX_customers_email"`);
    await queryRunner.query(`DROP INDEX "IDX_customers_organizationId"`);
    await queryRunner.query(`DROP INDEX "IDX_products_sku"`);
    await queryRunner.query(`DROP INDEX "IDX_products_organizationId"`);
    await queryRunner.query(`DROP INDEX "IDX_policies_resource_action"`);
    await queryRunner.query(`DROP INDEX "IDX_policies_organizationId"`);
    await queryRunner.query(`DROP INDEX "IDX_memberships_organizationId"`);
    await queryRunner.query(`DROP INDEX "IDX_memberships_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_users_cognitoId"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX "IDX_organization_closure_descendant"`);
    await queryRunner.query(`DROP INDEX "IDX_organization_closure_ancestor"`);
    await queryRunner.query(`DROP INDEX "IDX_organizations_parentId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TABLE "customers"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "policies"`);
    await queryRunner.query(`DROP TABLE "policy_sets"`);
    await queryRunner.query(`DROP TABLE "attribute_definitions"`);
    await queryRunner.query(`DROP TABLE "user_organization_memberships"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "organization_closure"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
  }
}
