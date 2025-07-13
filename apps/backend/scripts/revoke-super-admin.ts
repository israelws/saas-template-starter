#!/usr/bin/env node

/**
 * Script to revoke super admin role from a user
 * Usage: npm run revoke-super-admin -- <email>
 * 
 * This script is intended for platform owners only.
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

async function revokeSuperAdmin() {
  // Get email from command line arguments
  const email = process.argv[2];

  if (!email) {
    console.error('\x1b[31m%s\x1b[0m', 'Error: Please provide an email address');
    console.log('Usage: npm run revoke-super-admin -- <email>');
    process.exit(1);
  }

  console.log(`\n🔓 Revoking super admin role from: ${email}\n`);

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

    // Check if user is actually a super admin
    if (!user.metadata?.isSuperAdmin) {
      console.log('\x1b[33m%s\x1b[0m', '\n⚠️  User is not a super admin. No changes made.');
      await app.close();
      process.exit(0);
    }

    // Update user metadata to remove super admin role
    const updatedMetadata = {
      ...user.metadata,
      isSuperAdmin: false,
      superAdminRevokedAt: new Date().toISOString(),
      superAdminRevokedBy: 'system-script',
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

    console.log('\x1b[32m%s\x1b[0m', '\n✅ Successfully revoked super admin role!');
    console.log('\nUser details:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Name: ${user.firstName} ${user.lastName}`);
    console.log(`  - Super Admin: No`);
    console.log(`  - Revoked At: ${updatedMetadata.superAdminRevokedAt}`);

    console.log('\n⚠️  Important: The user will need to log out and log back in for changes to take effect.\n');

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Error:', error.message);
    process.exit(1);
  }
}

// Run the script
revokeSuperAdmin().catch((error) => {
  console.error('\x1b[31m%s\x1b[0m', 'Fatal error:', error);
  process.exit(1);
});