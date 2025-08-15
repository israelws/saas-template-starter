import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { seedExamplePolicies } from './example-policies.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  try {
    await seedExamplePolicies(dataSource);
    console.log('✅ Policy seeding completed successfully');
  } catch (error) {
    console.error('❌ Error seeding policies:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
