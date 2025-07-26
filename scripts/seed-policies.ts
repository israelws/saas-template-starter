import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { seedExamplePolicies } from '../apps/backend/src/seeds/example-policies.seed';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.dev') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'saas_template',
  entities: [path.join(__dirname, '../apps/backend/src/**/*.entity.{ts,js}')],
  synchronize: false,
  logging: true,
});

async function runSeed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    await seedExamplePolicies(AppDataSource);

    console.log('Policies seeded successfully');
  } catch (error) {
    console.error('Error seeding policies:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

runSeed();