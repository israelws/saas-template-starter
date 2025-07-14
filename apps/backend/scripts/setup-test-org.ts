#!/usr/bin/env node

/**
 * Script to set up a test organization and add a user to it
 * Usage: npm run setup-test-org
 * 
 * This script will:
 * 1. Create a test organization called "Test Company"
 * 2. Find the user with email "israel+t21@committed.co.il"
 * 3. Add the user to the organization with an "admin" role
 * 4. Set it as the user's default organization
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/modules/users/users.service';
import { OrganizationsService } from '../src/modules/organizations/organizations.service';
import { DataSource } from 'typeorm';
import { Organization } from '../src/modules/organizations/entities/organization.entity';
import { UserOrganizationMembership } from '../src/modules/users/entities/user-organization-membership.entity';
import { OrganizationType, UserRole } from '@saas-template/shared';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: path.join(__dirname, '..', envFile) });

const TEST_ORG_NAME = 'Test Company';
const TEST_USER_EMAIL = 'israel+t21@committed.co.il';

async function setupTestOrg() {
  console.log('\n🏢 Setting up test organization...\n');

  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: false, // Disable logging for cleaner output
    });

    const usersService = app.get(UsersService);
    const organizationsService = app.get(OrganizationsService);
    const dataSource = app.get(DataSource);

    // Step 1: Find the user
    console.log(`1️⃣  Finding user with email: ${TEST_USER_EMAIL}`);
    const user = await usersService.findByEmail(TEST_USER_EMAIL);

    if (!user) {
      console.error('\x1b[31m%s\x1b[0m', `Error: User with email '${TEST_USER_EMAIL}' not found`);
      await app.close();
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.firstName} ${user.lastName} (${user.email})`);

    // Step 2: Check if test organization already exists
    console.log(`\n2️⃣  Checking if organization '${TEST_ORG_NAME}' already exists...`);
    
    const existingOrg = await dataSource
      .getRepository(Organization)
      .findOne({ where: { name: TEST_ORG_NAME } });

    let organization: Organization;

    if (existingOrg) {
      console.log(`✓ Organization '${TEST_ORG_NAME}' already exists (ID: ${existingOrg.id})`);
      organization = existingOrg;
    } else {
      // Create new organization
      console.log(`Creating new organization '${TEST_ORG_NAME}'...`);
      
      const newOrg = dataSource.getRepository(Organization).create({
        name: TEST_ORG_NAME,
        code: 'TEST-COMPANY',
        type: OrganizationType.COMPANY,
        description: 'Test organization for development and testing',
        isActive: true,
        settings: {
          allowSubOrganizations: true,
          maxDepth: 4,
          features: ['all'],
        },
        metadata: {
          createdBy: 'setup-script',
          purpose: 'testing',
        },
      });

      organization = await dataSource.getRepository(Organization).save(newOrg);
      console.log(`✓ Created organization '${TEST_ORG_NAME}' (ID: ${organization.id})`);
    }

    // Step 3: Check if user is already a member
    console.log(`\n3️⃣  Checking user's organization membership...`);
    
    const existingMembership = await dataSource
      .getRepository(UserOrganizationMembership)
      .findOne({
        where: {
          userId: user.id,
          organizationId: organization.id,
        },
      });

    if (existingMembership) {
      console.log(`✓ User is already a member of '${TEST_ORG_NAME}'`);
      
      // Update to ensure it's the default and has admin role
      if (!existingMembership.isDefault || existingMembership.role !== UserRole.ADMIN) {
        console.log('Updating membership to set as default and admin role...');
        
        // First, remove default from any other memberships
        await dataSource
          .createQueryBuilder()
          .update(UserOrganizationMembership)
          .set({ isDefault: false })
          .where('userId = :userId', { userId: user.id })
          .execute();

        // Then update this membership
        await dataSource
          .createQueryBuilder()
          .update(UserOrganizationMembership)
          .set({
            isDefault: true,
            role: UserRole.ADMIN,
            updatedAt: new Date(),
          })
          .where('id = :id', { id: existingMembership.id })
          .execute();

        console.log('✓ Updated membership: set as default with admin role');
      }
    } else {
      // Create new membership
      console.log('Creating new organization membership...');
      
      // First, remove default from any other memberships
      await dataSource
        .createQueryBuilder()
        .update(UserOrganizationMembership)
        .set({ isDefault: false })
        .where('userId = :userId', { userId: user.id })
        .execute();

      // Create new membership
      const membership = dataSource.getRepository(UserOrganizationMembership).create({
        userId: user.id,
        organizationId: organization.id,
        role: UserRole.ADMIN,
        isDefault: true,
        isActive: true,
        permissions: ['*'], // Admin has all permissions
        metadata: {
          addedBy: 'setup-script',
        },
      });

      await dataSource.getRepository(UserOrganizationMembership).save(membership);
      console.log('✓ Added user to organization with admin role and set as default');
    }

    // Step 4: Display summary
    console.log('\n✅ Setup completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`  - Organization: ${organization.name} (ID: ${organization.id})`);
    console.log(`  - User: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`  - Role: Admin`);
    console.log(`  - Default Organization: Yes`);
    
    console.log('\n⚠️  Note: The user should now be able to access the dashboard without 403 errors.');
    console.log('   If already logged in, they may need to log out and log back in.\n');

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Error:', error.message);
    if (error.stack) {
      console.error('\x1b[31m%s\x1b[0m', 'Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the script
setupTestOrg().catch((error) => {
  console.error('\x1b[31m%s\x1b[0m', 'Fatal error:', error);
  process.exit(1);
});