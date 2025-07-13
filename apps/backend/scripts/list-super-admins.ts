#!/usr/bin/env node

/**
 * Script to list all users with super admin role
 * Usage: npm run list-super-admins
 * 
 * This script is intended for platform owners only.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: path.join(__dirname, '..', envFile) });

async function listSuperAdmins() {
  console.log('\n👥 Listing all super admins...\n');

  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: false, // Disable logging for cleaner output
    });

    const dataSource = app.get(DataSource);

    // Query for all super admins
    const superAdmins = await dataSource.query(`
      SELECT 
        id,
        email,
        "firstName",
        "lastName",
        status,
        metadata,
        "createdAt",
        "lastLoginAt"
      FROM users
      WHERE metadata->>'isSuperAdmin' = 'true'
      ORDER BY "createdAt" DESC
    `);

    if (superAdmins.length === 0) {
      console.log('\x1b[33m%s\x1b[0m', 'No super admins found.');
      console.log('\nTo assign a super admin, run:');
      console.log('  npm run assign-super-admin -- <email>');
    } else {
      console.log(`Found ${superAdmins.length} super admin(s):\n`);
      
      superAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.firstName} ${admin.lastName}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   ID: ${admin.id}`);
        console.log(`   Status: ${admin.status}`);
        console.log(`   Last Login: ${admin.lastLoginAt || 'Never'}`);
        console.log(`   Assigned At: ${admin.metadata?.superAdminAssignedAt || 'Unknown'}`);
        console.log(`   Assigned By: ${admin.metadata?.superAdminAssignedBy || 'Unknown'}`);
        console.log('');
      });
    }

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Error:', error.message);
    process.exit(1);
  }
}

// Run the script
listSuperAdmins().catch((error) => {
  console.error('\x1b[31m%s\x1b[0m', 'Fatal error:', error);
  process.exit(1);
});