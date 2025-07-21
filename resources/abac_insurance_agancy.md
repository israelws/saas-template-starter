
# Comprehensive ABAC Implementation Guide for Multi-Tenant Insurance Agency System

This guide provides a complete, production-ready implementation of Attribute-Based Access Control (ABAC) for your multi-tenant insurance agency system using NestJS, PostgreSQL, and TypeORM.

## Executive Summary

Your multi-tenant insurance system requires sophisticated access control that goes beyond traditional role-based systems. ABAC provides the flexibility to handle complex scenarios like users with multiple roles across agencies, field-level permissions, and dynamic context-aware access decisions. This implementation guide covers architecture, code examples, security considerations, and migration strategies tailored specifically for insurance industry requirements.

## System Architecture

### Core ABAC Components

The system implements the NIST SP 800-162 standard architecture with four fundamental components:

1. **Policy Enforcement Point (PEP)**: NestJS guards and interceptors that protect your APIs
2. **Policy Decision Point (PDP)**: Central engine evaluating access requests against policies  
3. **Policy Information Point (PIP)**: Attribute retrieval from PostgreSQL and external sources
4. **Policy Administration Point (PAP)**: NextJS dashboard for policy management

### Multi-Tenant Design Pattern

For your hierarchical structure (System Admin > Agency > Branches), I recommend the **Per-Tenant Policy Store** approach, providing complete isolation between agencies while sharing infrastructure.

## Database Schema

```sql
-- Multi-tenant organizations with hierarchical structure
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users with flexible attribute storage
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    attribute_key VARCHAR(100) NOT NULL,
    attribute_value TEXT NOT NULL,
    agency_id UUID REFERENCES agencies(id),
    branch_id UUID REFERENCES branches(id),
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP,
    INDEX idx_user_attributes (user_id, attribute_key, agency_id)
);

-- Multi-role support
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_name VARCHAR(100) NOT NULL,
    agency_id UUID REFERENCES agencies(id),
    branch_id UUID REFERENCES branches(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_name, agency_id, branch_id)
);

-- ABAC policies with JSON conditions
CREATE TABLE abac_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    effect VARCHAR(10) CHECK (effect IN ('Allow', 'Deny')),
    subjects JSONB NOT NULL,
    resources JSONB NOT NULL,
    actions TEXT[] NOT NULL,
    conditions JSONB,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE abac_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY agency_isolation ON abac_policies 
    USING (agency_id = current_setting('app.current_agency_id')::UUID);
```

## NestJS Implementation

### CASL Integration for Field-Level Access

```typescript
// casl-ability.factory.ts
import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';

@Injectable()
export class CaslAbilityFactory {
  async createForUser(user: User, agencyId: string, branchId?: string) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);
    const userRole = await this.getUserRoleInContext(user.id, agencyId, branchId);
    
    switch (userRole) {
      case 'SystemAdmin':
        can('manage', 'all');
        break;
        
      case 'AgencyAdmin':
        can('manage', 'all', { agencyId });
        cannot('delete', 'Agency');
        break;
        
      case 'BranchManager':
        can('read', 'InsurancePolicy', { branchId });
        can('approve', 'InsurancePolicy', { 
          branchId, 
          coverageAmount: { $lte: 100000 } 
        });
        break;
        
      case 'InsuranceAgent':
        can('create', 'InsurancePolicy', { agencyId });
        can('read', 'InsurancePolicy', { agentId: user.id });
        // Field-level restrictions
        cannot('read', 'InsurancePolicy', 'customerAge');
        cannot('read', 'InsurancePolicy', 'healthHistory');
        break;
        
      case 'Secretary':
        can('create', 'Claim', { branchId });
        cannot('approve', 'Claim');
        cannot('read', 'InsurancePolicy', 'premiumAmount');
        break;
    }
    
    return build();
  }
}
```

### ABAC Guard Implementation

```typescript
@Injectable()
export class ABACGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const agencyId = request.headers['x-agency-id'];
    const branchId = request.headers['x-branch-id'];
    
    const ability = await this.caslAbilityFactory.createForUser(
      user, 
      agencyId, 
      branchId
    );
    
    request.ability = ability;
    
    const policyHandlers = this.reflector.get<PolicyHandler[]>(
      CHECK_POLICIES_KEY,
      context.getHandler(),
    ) || [];

    return policyHandlers.every((handler) => handler.handle(ability));
  }
}
```

### Field-Level Access Control

```typescript
@Injectable()
export class FieldAccessInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        const request = context.switchToHttp().getRequest();
        const ability = request.ability;
        
        if (!ability) return data;
        
        const filterFields = (item: any) => {
          if (!item || typeof item !== 'object') return item;
          
          const fields = permittedFieldsOf(ability, 'read', item);
          const filtered = {};
          
          fields.forEach(field => {
            if (field in item) {
              filtered[field] = item[field];
            }
          });
          
          return filtered;
        };
        
        return Array.isArray(data) 
          ? data.map(filterFields)
          : filterFields(data);
      }),
    );
  }
}
```

## Insurance-Specific Policy Examples

### Agency Administrator Policy
```javascript
{
  name: 'Agency Administrator Full Access',
  effect: 'Allow',
  subjects: {
    roles: ['AgencyAdmin'],
    attributes: {
      securityClearance: 'High',
      accountStatus: 'Active'
    }
  },
  resources: {
    types: ['Policy', 'Claim', 'User', 'Branch'],
    attributes: {
      agencyId: '${subject.agencyId}'
    }
  },
  actions: ['*'],
  conditions: {
    timeWindow: {
      businessHours: true
    },
    mfa: {
      required: true
    }
  }
}
```

### Insurance Agent Policy
```javascript
{
  name: 'Insurance Agent Policy Access',
  effect: 'Allow',
  subjects: {
    roles: ['InsuranceAgent'],
    attributes: {
      licenseStatus: 'Active'
    }
  },
  resources: {
    types: ['Policy'],
    attributes: {
      OR: [
        { agentId: '${subject.userId}' },
        { delegatedAgents: { contains: '${subject.userId}' } }
      ]
    }
  },
  actions: ['read', 'update', 'renew'],
  conditions: {
    dataFields: {
      denied: ['customerAge', 'healthHistory', 'creditScore']
    }
  }
}
```

### Customer Portal Policy
```javascript
{
  name: 'Customer Self-Service Access',
  effect: 'Allow',
  subjects: {
    roles: ['Customer'],
    attributes: {
      accountStatus: 'Active',
      emailVerified: true
    }
  },
  resources: {
    types: ['Policy', 'Claim'],
    attributes: {
      customerId: '${subject.customerId}'
    }
  },
  actions: ['read', 'download'],
  conditions: {
    mfa: {
      required: true
    },
    sessionSecurity: {
      maxDuration: 1800
    }
  }
}
```

## Multi-Role Handling

```typescript
@Injectable()
export class MultiRoleAuthorizationService {
  async evaluateMultiRoleAccess(
    user: User,
    resource: any,
    action: string
  ): Promise<boolean> {
    const userContexts = await this.getUserContexts(user.id);
    const sortedContexts = this.sortContextsByPrecedence(userContexts);
    
    for (const context of sortedContexts) {
      const ability = await this.caslAbilityFactory.createForUser(
        user,
        context.agencyId,
        context.branchId
      );
      
      if (ability.can(action, resource)) {
        await this.auditService.logAccess({
          userId: user.id,
          role: context.role,
          agencyId: context.agencyId,
          resource: resource.id,
          action,
          granted: true
        });
        
        return true;
      }
    }
    
    return false;
  }
}
```

## Customer Portal Security

### Zero-Trust Implementation
```typescript
@Injectable()
export class ZeroTrustMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const verificationSteps = [
      this.verifyDeviceTrust(req),
      this.verifySessionIntegrity(req),
      this.assessRiskScore(req),
      this.verifyNetworkContext(req)
    ];
    
    const results = await Promise.all(verificationSteps);
    const trustScore = this.calculateTrustScore(results);
    
    if (trustScore < 0.5) {
      throw new UnauthorizedException('Additional authentication required');
    }
    
    req['trustContext'] = {
      score: trustScore,
      factors: results,
      timestamp: new Date()
    };
    
    next();
  }
}
```

### Row-Level Security
```typescript
@Injectable()
export class SecureCustomerRepository {
  async findCustomerPolicies(customerId: string): Promise<InsurancePolicy[]> {
    await this.dataSource.query(
      'SET LOCAL app.current_customer_id = $1',
      [customerId]
    );
    
    return this.policyRepository
      .createQueryBuilder('policy')
      .where('policy.customerId = :customerId', { customerId })
      .select([
        'policy.id',
        'policy.policyNumber',
        'policy.coverageType',
        'policy.premiumAmount'
        // Exclude sensitive fields
      ])
      .getMany();
  }
}
```

## Migration Strategy

### Phase 1: Assessment (2 weeks)
- Analyze existing RBAC system
- Map roles to attributes
- Define migration timeline

### Phase 2: Parallel Implementation (4-6 weeks)
```typescript
@Injectable()
export class HybridAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const abacEnabled = await this.featureFlags.isEnabled(
      'ABAC_MIGRATION',
      { endpoint: context.getHandler().name, percentage: 10 }
    );
    
    if (abacEnabled) {
      try {
        return await this.abacService.authorize(request);
      } catch (error) {
        return this.rbacService.authorize(request);
      }
    }
    
    return this.rbacService.authorize(request);
  }
}
```

### Phase 3: Testing and Optimization
- Performance testing (target <50ms evaluation)
- Security testing
- Load testing (1000+ concurrent requests)

### Phase 4: Full Migration
- Complete cutover
- Remove legacy RBAC code
- Optimize caching and performance

## Performance Optimization

```typescript
@Injectable()
export class ABACCacheService {
  async evaluateWithCache(context: ABACContext): Promise<boolean> {
    const cacheKey = this.generateCacheKey(context);
    
    // Check L1 cache (memory)
    let result = this.memoryCache.get(cacheKey);
    if (result !== undefined) return result;
    
    // Check L2 cache (Redis)
    result = await this.redisCache.get(cacheKey);
    if (result !== undefined) {
      this.memoryCache.set(cacheKey, result);
      return result;
    }
    
    // Evaluate and cache
    result = await this.abacService.evaluate(context);
    
    const ttl = this.calculateTTL(context);
    await this.redisCache.set(cacheKey, result, ttl);
    this.memoryCache.set(cacheKey, result);
    
    return result;
  }
}
```

## Monitoring and Compliance

```typescript
@Injectable()
export class ABACMonitoringService {
  async logEvaluation(
    context: EvaluationContext,
    decision: Decision,
    duration: number
  ): Promise<void> {
    const auditEntry = {
      timestamp: new Date(),
      userId: context.subject.id,
      action: context.action,
      resourceType: context.resource.type,
      decision: decision.effect,
      agencyId: context.subject.agencyId,
      duration
    };
    
    await this.auditRepository.save(auditEntry);
    await this.elasticsearchService.index({
      index: 'abac-audit-logs',
      body: auditEntry
    });
    
    if (await this.isAnomalous(context, decision)) {
      await this.alertSecurityTeam(context, decision);
    }
  }
}
```

## Key Recommendations

1. **Start with CASL** for NestJS integration - it provides the best balance of features and ease of use
2. **Implement caching aggressively** - target 80%+ cache hit rate for production
3. **Use Row-Level Security** in PostgreSQL for true multi-tenant isolation
4. **Monitor everything** - ABAC decisions, performance metrics, and security events
5. **Test thoroughly** - including performance, security, and migration scenarios
6. **Phase the migration** - use feature flags and gradual rollout

## Expected Timeline

- Planning: 2-3 weeks
- Development: 4-8 weeks
- Testing: 2-4 weeks
- Phased rollout: 4-6 weeks
- **Total: 3-6 months**

This implementation provides a secure, scalable, and maintainable ABAC system tailored for your multi-tenant insurance agency requirements, with field-level access control, customer portal security, and comprehensive monitoring.