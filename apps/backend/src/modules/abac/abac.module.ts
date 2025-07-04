import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AttributeDefinition } from './entities/attribute-definition.entity';
import { Policy } from './entities/policy.entity';
import { PolicySet } from './entities/policy-set.entity';
import { PolicyService } from './services/policy.service';
import { AttributeService } from './services/attribute.service';
import { PolicyEvaluatorService } from './services/policy-evaluator.service';
import { HierarchicalAbacService } from './services/hierarchical-abac.service';
import { PolicyController } from './controllers/policy.controller';
import { AttributeController } from './controllers/attribute.controller';
import { AbacGuard } from './guards/abac.guard';
import { OrganizationsModule } from '../organizations/organizations.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AttributeDefinition, Policy, PolicySet]),
    CacheModule.register({
      ttl: 300, // 5 minutes
      max: 1000, // Maximum number of items in cache
    }),
    OrganizationsModule,
  ],
  controllers: [PolicyController, AttributeController],
  providers: [
    PolicyService,
    AttributeService,
    PolicyEvaluatorService,
    HierarchicalAbacService,
    AbacGuard,
  ],
  exports: [
    PolicyService,
    AttributeService,
    PolicyEvaluatorService,
    HierarchicalAbacService,
    AbacGuard,
  ],
})
export class AbacModule {}