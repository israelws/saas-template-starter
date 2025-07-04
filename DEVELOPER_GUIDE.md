# Developer Guide - SAAS Template Starter

## Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Docker and Docker Compose
- AWS Account (for Cognito)
- PostgreSQL client (optional, for direct DB access)

### Initial Setup

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd saas-template-starter
npm install
```

2. **Environment Configuration**
Create `.env.dev` in the root directory:
```env
NODE_ENV=development
DATABASE_URL=postgresql://saas_user:saas_password@localhost:5432/saas_template_db
REDIS_URL=redis://localhost:6379
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=your-pool-id
COGNITO_CLIENT_ID=your-client-id
```

3. **Start Development Environment**
```bash
# Start all services with Docker Compose
docker-compose up -d

# Or run services individually
npm run backend:dev    # Backend on http://localhost:3000
npm run admin:dev     # Admin Dashboard on http://localhost:3001
npm run frontend:dev  # Frontend on http://localhost:3002
```

## Project Structure

### Apps
- **backend**: NestJS API server with TypeORM
- **admin-dashboard**: Next.js admin panel with shadcn/ui
- **frontend**: Customer-facing Next.js application

### Packages
- **shared**: Shared TypeScript types and utilities
- **ui**: Reusable React components

### Key Directories
```
saas-template-starter/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── modules/       # Feature modules
│   │   │   ├── common/        # Shared services
│   │   │   └── main.ts        # Application entry
│   │   └── test/              # Tests
│   ├── admin-dashboard/
│   │   ├── app/               # Next.js app directory
│   │   ├── components/        # React components
│   │   └── lib/               # Utilities
│   └── frontend/
├── packages/
│   ├── shared/
│   │   └── src/
│   │       ├── types/         # Shared TypeScript types
│   │       └── utils/         # Shared utilities
│   └── ui/
│       └── src/
│           └── components/    # Reusable UI components
└── infrastructure/            # Terraform configurations
```

## Development Workflow

### 1. Creating New Features

#### Backend (NestJS)
```bash
# Generate a new module
cd apps/backend
nest g module modules/feature-name
nest g controller modules/feature-name
nest g service modules/feature-name
```

#### Frontend Components
```bash
# Add shadcn/ui component
cd apps/admin-dashboard
npx shadcn-ui@latest add button
```

### 2. Database Development

#### Create Migration
```bash
cd apps/backend
npm run typeorm migration:create -- -n MigrationName
npm run typeorm migration:run
```

#### Entity Example
```typescript
// apps/backend/src/modules/organizations/entities/organization.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, Tree, TreeParent, TreeChildren } from 'typeorm';

@Entity('organizations')
@Tree("closure-table")
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ['company', 'division', 'department', 'team'] })
  type: string;

  @TreeParent()
  parent: Organization;

  @TreeChildren()
  children: Organization[];
}
```

### 3. API Development

#### Controller Example
```typescript
// apps/backend/src/modules/organizations/organizations.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AbacGuard } from '@/common/guards/abac.guard';
import { RequirePolicy } from '@/common/decorators/policy.decorator';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(AbacGuard)
export class OrganizationsController {
  @Get()
  @ApiOperation({ summary: 'List organizations' })
  @RequirePolicy({ action: 'read', resource: 'organization' })
  findAll() {
    // Implementation
  }
}
```

### 4. Frontend Development

#### Page Example
```tsx
// apps/admin-dashboard/app/organizations/page.tsx
import { OrganizationList } from '@/components/organizations/organization-list';

export default function OrganizationsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Organizations</h1>
      <OrganizationList />
    </div>
  );
}
```

## Testing

### Backend Testing
```bash
cd apps/backend
npm test                    # Unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # Coverage report
```

### Frontend Testing
```bash
cd apps/admin-dashboard
npm test                    # Unit tests
npm run test:e2e           # E2E tests with Playwright
```

## ABAC Implementation

### Policy Definition
```typescript
// Example policy structure
{
  id: 'policy-uuid',
  name: 'Allow managers to read their department data',
  effect: 'allow',
  subjects: {
    attributes: {
      'user.role': 'manager',
      'user.department': '${resource.department}'
    }
  },
  resources: {
    type: 'order',
    attributes: {
      'resource.department': '*'
    }
  },
  actions: ['read'],
  conditions: {
    timeWindow: {
      start: '08:00',
      end: '18:00'
    }
  }
}
```

### Using Policies in Code
```typescript
// Backend
@RequirePolicy({
  action: 'update',
  resource: 'order',
  context: (req) => ({
    resourceId: req.params.id,
    organizationId: req.user.organizationId
  })
})

// Frontend
const canEdit = await checkPolicy({
  action: 'update',
  resource: 'order',
  resourceId: order.id
});
```

## Deployment

### Development
```bash
docker-compose up -d
```

### Staging/Production
```bash
# Build all applications
npm run build

# Deploy with Terraform
cd infrastructure
terraform init
terraform plan -var-file=environments/staging.tfvars
terraform apply -var-file=environments/staging.tfvars
```

## Common Tasks

### Add New Dependency
```bash
# To specific workspace
npm install package-name --workspace=apps/backend

# To root
npm install -D package-name
```

### Run Specific Workspace Command
```bash
npm run dev --workspace=apps/backend
```

### Clean Install
```bash
npm run clean
npm install
```

## Troubleshooting

### Database Connection Issues
1. Check Docker containers: `docker ps`
2. Verify PostgreSQL is running: `docker logs saas-template-postgres`
3. Test connection: `psql -h localhost -U saas_user -d saas_template_db`

### Build Errors
1. Clear caches: `npm run clean`
2. Reinstall dependencies: `npm install`
3. Check TypeScript errors: `npm run typecheck`

### Performance Issues
1. Check Redis connection
2. Enable query logging in TypeORM
3. Use PostgreSQL EXPLAIN for slow queries

## Best Practices

1. **Always use TypeScript** - No `any` types
2. **Document APIs** - Use Swagger decorators
3. **Test Coverage** - Maintain >80% coverage
4. **Use Transactions** - For multi-table operations
5. **Implement Caching** - Use Redis for frequently accessed data
6. **Follow REST Standards** - Consistent API design
7. **Use DTOs** - Validate all inputs
8. **Handle Errors Gracefully** - Proper error messages
9. **Log Everything** - Structured logging with correlation IDs
10. **Security First** - Always check permissions

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeORM Documentation](https://typeorm.io)
- [shadcn/ui Components](https://ui.shadcn.com)
- [AWS Cognito Guide](https://docs.aws.amazon.com/cognito)
- [Project Requirements](./resources/Template%20Starter%20Kit%20for%20SAAS%20platform%20and%20Digital%20Application%20(1).docx)