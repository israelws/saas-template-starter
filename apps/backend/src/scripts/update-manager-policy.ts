import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Policy } from '../modules/abac/entities/policy.entity';

async function updateManagerPolicy() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  try {
    const policyRepository = dataSource.getRepository(Policy);

    // Find the Manager Product Access policy
    const policy = await policyRepository.findOne({
      where: { id: '8317026e-1486-4e2e-a4da-8bb4ac2352f2' },
    });

    if (policy) {
      console.log('Found policy:', policy.name);
      console.log('Current resources:', JSON.stringify(policy.resources, null, 2));

      // Update to include organizationId attribute
      policy.resources = {
        types: ['product'],
        attributes: {
          organizationId: '${subject.organizationId}',
        },
      };

      await policyRepository.save(policy);

      console.log('\nUpdated resources:', JSON.stringify(policy.resources, null, 2));
      console.log('✅ Policy updated successfully');
    } else {
      console.log('Policy not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await app.close();
  }
}

updateManagerPolicy();
