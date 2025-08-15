import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Policy } from '../modules/abac/entities/policy.entity';
import { PolicyScope, PolicyEffect } from '@saas-template/shared';

async function addAdminPolicyAccess() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const policyRepository = dataSource.getRepository(Policy);

    // Create a policy that allows admins to manage policies
    const adminPolicyAccess = policyRepository.create({
      name: 'Admin Policy Management',
      description: 'Allows administrators to view and manage policies',
      scope: PolicyScope.SYSTEM,
      effect: PolicyEffect.ALLOW,
      priority: 5,
      isActive: true,
      actions: ['create', 'read', 'update', 'delete', 'list'],
      subjects: {
        roles: ['admin'],
      },
      resources: {
        types: ['policy', 'attribute', 'policy-set'],
      },
      conditions: {},
    });

    await policyRepository.save(adminPolicyAccess);
    console.log('✅ Admin policy access added successfully');

    // Also create a temporary policy for all authenticated users to list policies
    const tempPolicyAccess = policyRepository.create({
      name: 'Temporary Policy List Access',
      description: 'Temporary policy allowing all authenticated users to list policies for testing',
      scope: PolicyScope.SYSTEM,
      effect: PolicyEffect.ALLOW,
      priority: 90,
      isActive: true,
      actions: ['list'],
      subjects: {
        attributes: {
          authenticated: true,
        },
      },
      resources: {
        types: ['policy'],
      },
      conditions: {},
    });

    await policyRepository.save(tempPolicyAccess);
    console.log('✅ Temporary policy list access added successfully');
  } catch (error) {
    console.error('❌ Error adding admin policy access:', error);
  } finally {
    await app.close();
  }
}

addAdminPolicyAccess();
