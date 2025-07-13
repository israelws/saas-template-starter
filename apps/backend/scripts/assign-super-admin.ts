#!/usr/bin/env node

/**
 * Script to assign super admin role to a user
 * Usage: npm run assign-super-admin -- <email>
 * 
 * This script is intended for platform owners only.
 * Super admins have full access to:
 * - Create, update, delete organizations
 * - Create, update, delete users
 * - Create, update, delete policies
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/modules/users/users.service';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: path.join(__dirname, '..', envFile) });

async function assignSuperAdmin() {
  // Get email from command line arguments
  const email = process.argv[2];

  if (!email) {
    console.error('\x1b[31m%s\x1b[0m', 'Error: Please provide an email address');
    console.log('Usage: npm run assign-super-admin -- <email>');
    process.exit(1);
  }

  console.log(`\n🔐 Assigning super admin role to: ${email}\n`);

  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: false, // Disable logging for cleaner output
    });

    const usersService = app.get(UsersService);
    const dataSource = app.get(DataSource);

    // Find user by email
    const user = await usersService.findByEmail(email);

    if (!user) {
      console.error('\x1b[31m%s\x1b[0m', `Error: User with email '${email}' not found`);
      await app.close();
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.firstName} ${user.lastName} (${user.email})`);

    // Update user metadata to include super admin role
    const updatedMetadata = {
      ...user.metadata,
      isSuperAdmin: true,
      superAdminAssignedAt: new Date().toISOString(),
      superAdminAssignedBy: 'system-script',
    };

    // Update user using the data source
    await dataSource
      .createQueryBuilder()
      .update('users')
      .set({
        metadata: updatedMetadata,
        updatedAt: new Date(),
      })
      .where('id = :id', { id: user.id })
      .execute();

    console.log('\x1b[32m%s\x1b[0m', '\n✅ Successfully assigned super admin role!');
    console.log('\nUser details:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Name: ${user.firstName} ${user.lastName}`);
    console.log(`  - Super Admin: Yes`);
    console.log(`  - Assigned At: ${updatedMetadata.superAdminAssignedAt}`);

    console.log('\n⚠️  Important: The user will need to log out and log back in for changes to take effect.\n');

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Error:', error.message);
    process.exit(1);
  }
}

// Run the script
assignSuperAdmin().catch((error) => {
  console.error('\x1b[31m%s\x1b[0m', 'Fatal error:', error);
  process.exit(1);
});