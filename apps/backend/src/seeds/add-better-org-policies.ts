import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Policy } from '../modules/abac/entities/policy.entity';
import { PolicyScope, PolicyEffect } from '@saas-template/shared';

async function addBetterOrgPolicies() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  
  try {
    const policyRepository = dataSource.getRepository(Policy);
    
    // Create a better organization admin policy with dynamic organization reference
    const betterOrgAdminPolicy = policyRepository.create({
      name: 'Dynamic Organization Admin Policy',
      description: 'Grants admins full access within their current organization (dynamic)',
      scope: PolicyScope.SYSTEM, // System-level so it applies to all orgs
      effect: PolicyEffect.ALLOW,
      priority: 15,
      isActive: true,
      actions: ['*'],
      subjects: {
        roles: ['admin']
      },
      resources: {
        types: ['*'],
        attributes: {
          // This dynamically matches the user's current organization
          organizationId: '${subject.organizationId}'
        }
      },
      conditions: {}
    });
    
    await policyRepository.save(betterOrgAdminPolicy);
    console.log('✅ Added dynamic organization admin policy');
    
    // Create a manager policy with proper organization scoping
    const managerPolicy = policyRepository.create({
      name: 'Dynamic Manager Policy',
      description: 'Allows managers to manage products and customers in their organization',
      scope: PolicyScope.SYSTEM,
      effect: PolicyEffect.ALLOW,
      priority: 30,
      isActive: true,
      actions: ['create', 'read', 'update', 'list'],
      subjects: {
        roles: ['manager']
      },
      resources: {
        types: ['product', 'customer', 'order'],
        attributes: {
          // Ensures resources must belong to the user's organization
          organizationId: '${subject.organizationId}'
        }
      },
      conditions: {}
    });
    
    await policyRepository.save(managerPolicy);
    console.log('✅ Added dynamic manager policy');
    
    // Show the difference between static and dynamic policies
    console.log('\n📌 Key Difference:');
    console.log('Static: organizationId: "fd8f7668-b013-4428-be54-4f35d53c6ee8"');
    console.log('Dynamic: organizationId: "${subject.organizationId}"');
    console.log('\nThe dynamic version works for ANY organization!');
    
  } catch (error) {
    console.error('❌ Error adding policies:', error);
  } finally {
    await app.close();
  }
}

addBetterOrgPolicies();