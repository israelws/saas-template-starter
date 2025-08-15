import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Policy } from '../modules/abac/entities/policy.entity';

async function updatePoliciesToDynamic() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const policyRepository = dataSource.getRepository(Policy);

    // Find all policies with hardcoded organization IDs
    const policies = await policyRepository.find();

    let updatedCount = 0;

    for (const policy of policies) {
      let needsUpdate = false;

      // Check if resources.attributes.organizationId is a hardcoded UUID
      if (policy.resources?.attributes?.organizationId) {
        const orgId = policy.resources.attributes.organizationId;
        // Check if it's a UUID (not a dynamic variable)
        if (
          typeof orgId === 'string' &&
          !orgId.includes('${') &&
          orgId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        ) {
          console.log(`\nUpdating policy: ${policy.name}`);
          console.log(`  Old organizationId: ${orgId}`);

          // Update to dynamic variable
          policy.resources.attributes.organizationId = '${subject.organizationId}';
          needsUpdate = true;

          console.log(`  New organizationId: ${policy.resources.attributes.organizationId}`);
        }
      }

      if (needsUpdate) {
        await policyRepository.save(policy);
        updatedCount++;
      }
    }

    console.log(`\n✅ Updated ${updatedCount} policies to use dynamic organization references`);

    // Show updated policies
    const updatedPolicies = await policyRepository.find({
      where: {
        name: 'Organization Admin Policy',
      },
    });

    if (updatedPolicies.length > 0) {
      console.log('\nExample updated policy:');
      console.log(JSON.stringify(updatedPolicies[0].resources, null, 2));
    }
  } catch (error) {
    console.error('❌ Error updating policies:', error);
  } finally {
    await app.close();
  }
}

updatePoliciesToDynamic();
