import { Module, Global, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AttributeDefinition } from './entities/attribute-definition.entity';
import { Policy } from './entities/policy.entity';
import { PolicySet } from './entities/policy-set.entity';
import { PolicyFieldRule } from './entities/policy-field-rule.entity';
import { PolicyService } from './services/policy.service';
import { AttributeService } from './services/attribute.service';
import { PolicyEvaluatorService } from './services/policy-evaluator.service';
import { CachedPolicyEvaluatorService } from './services/cached-policy-evaluator.service';
import { HierarchicalAbacService } from './services/hierarchical-abac.service';
import { FieldAuditService, FieldAccessMonitor } from './services/field-audit.service';
import { PolicyController } from './controllers/policy.controller';
import { AttributeController } from './controllers/attribute.controller';
import { AbacGuard } from './guards/abac.guard';
import { CaslAbacGuard } from './guards/casl-abac.guard';
import { PolicyRepository } from './repositories/policy.repository';
import { CaslAbilityFactory } from './factories/casl-ability.factory';
import {
  FieldAccessInterceptor,
  FieldFilterService,
} from './interceptors/field-access.interceptor';
import { CacheModule } from '../../common/cache/cache.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AttributeDefinition, Policy, PolicySet, PolicyFieldRule]),
    EventEmitterModule.forRoot(),
    CacheModule,
    OrganizationsModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [PolicyController, AttributeController],
  providers: [
    PolicyService,
    AttributeService,
    PolicyEvaluatorService,
    CachedPolicyEvaluatorService,
    HierarchicalAbacService,
    AbacGuard,
    CaslAbacGuard,
    PolicyRepository,
    CaslAbilityFactory,
    FieldAccessInterceptor,
    FieldFilterService,
    FieldAuditService,
    FieldAccessMonitor,
  ],
  exports: [
    PolicyService,
    AttributeService,
    PolicyEvaluatorService,
    CachedPolicyEvaluatorService,
    HierarchicalAbacService,
    AbacGuard,
    CaslAbacGuard,
    PolicyRepository,
    CaslAbilityFactory,
    FieldAccessInterceptor,
    FieldFilterService,
    FieldAuditService,
  ],
})
export class AbacModule {}
