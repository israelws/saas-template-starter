import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeDefinition } from './entities/attribute-definition.entity';
import { Policy } from './entities/policy.entity';
import { PolicySet } from './entities/policy-set.entity';
import { PolicyService } from './services/policy.service';
import { AttributeService } from './services/attribute.service';
import { PolicyEvaluatorService } from './services/policy-evaluator.service';
import { CachedPolicyEvaluatorService } from './services/cached-policy-evaluator.service';
import { HierarchicalAbacService } from './services/hierarchical-abac.service';
import { PolicyController } from './controllers/policy.controller';
import { AttributeController } from './controllers/attribute.controller';
import { AbacGuard } from './guards/abac.guard';
import { PolicyRepository } from './repositories/policy.repository';
import { CacheModule } from '../../common/cache/cache.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AttributeDefinition, Policy, PolicySet]),
    CacheModule,
    OrganizationsModule,
  ],
  controllers: [PolicyController, AttributeController],
  providers: [
    PolicyService,
    AttributeService,
    PolicyEvaluatorService,
    CachedPolicyEvaluatorService,
    HierarchicalAbacService,
    AbacGuard,
    PolicyRepository,
  ],
  exports: [
    PolicyService,
    AttributeService,
    PolicyEvaluatorService,
    CachedPolicyEvaluatorService,
    HierarchicalAbacService,
    AbacGuard,
    PolicyRepository,
  ],
})
export class AbacModule {}