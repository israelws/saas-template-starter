# Developer Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Architecture Overview](#architecture-overview)
8. [Common Development Tasks](#common-development-tasks)
9. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Docker**: v20.0.0 or higher
- **PostgreSQL**: v14.0 or higher (or use Docker)
- **Redis**: v6.0 or higher (or use Docker)
- **Git**: Latest version

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd saas-template-starter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp apps/backend/.env.example apps/backend/.env.dev
   cp apps/admin-dashboard/.env.example apps/admin-dashboard/.env.local
   ```

4. **Start development services:**
   ```bash
   docker-compose up -d  # Start PostgreSQL and Redis
   npm run dev          # Start all applications
   ```

5. **Run database migrations:**
   ```bash
   cd apps/backend
   npm run migration:run
   ```

6. **Seed demo data:**
   ```bash
   npm run seed
   ```

7. **Access applications:**
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/api/docs
   - Admin Dashboard: http://localhost:3001

## Development Environment Setup

### Local Development with Docker

The fastest way to get started is using Docker Compose:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services included:
- **PostgreSQL**: Database (port 5432)
- **Redis**: Caching and sessions (port 6379)
- **Backend**: NestJS API (port 3000)
- **Admin Dashboard**: Next.js frontend (port 3001)

### Manual Setup

If you prefer to run services manually:

1. **Database Setup:**
   ```bash
   # Install PostgreSQL locally or use Docker
   docker run --name postgres-dev -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14
   
   # Create database
   createdb saas_template_dev
   ```

2. **Redis Setup:**
   ```bash
   # Install Redis locally or use Docker
   docker run --name redis-dev -p 6379:6379 -d redis:7-alpine
   ```

3. **Backend Setup:**
   ```bash
   cd apps/backend
   npm install
   npm run dev
   ```

4. **Frontend Setup:**
   ```bash
   cd apps/admin-dashboard
   npm install
   npm run dev
   ```

### AWS Cognito Setup

The project uses AWS Cognito for authentication:

1. **Create AWS Cognito User Pool:**
   - User pool name: `saas-template-dev`
   - Configure app client with client secret
   - Enable standard attributes: email, given_name, family_name

2. **Configure Environment Variables:**
   ```env
   AWS_REGION=us-east-1
   AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
   AWS_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
   AWS_COGNITO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Create Test Users:**
   ```bash
   # Use AWS CLI or AWS Console to create test users
   aws cognito-idp admin-create-user \
     --user-pool-id us-east-1_xxxxxxxxx \
     --username admin@test.com \
     --temporary-password TempPass123! \
     --message-action SUPPRESS
   ```

## Project Structure

```
saas-template-starter/
├── apps/
│   ├── backend/                    # NestJS API backend
│   │   ├── src/
│   │   │   ├── modules/           # Feature modules
│   │   │   │   ├── auth/          # Authentication
│   │   │   │   ├── users/         # User management
│   │   │   │   ├── organizations/ # Organization hierarchy
│   │   │   │   ├── abac/          # ABAC policies
│   │   │   │   └── ...
│   │   │   ├── common/            # Shared utilities
│   │   │   │   ├── decorators/    # Custom decorators
│   │   │   │   ├── filters/       # Exception filters
│   │   │   │   ├── guards/        # Auth guards
│   │   │   │   ├── interceptors/  # Request interceptors
│   │   │   │   └── pipes/         # Validation pipes
│   │   │   ├── database/          # Database related
│   │   │   │   ├── migrations/    # TypeORM migrations
│   │   │   │   └── seeds/         # Demo data seeders
│   │   │   └── main.ts            # Application entry point
│   │   ├── test/                  # Test utilities
│   │   └── package.json
│   └── admin-dashboard/           # Next.js admin frontend
│       ├── app/                   # App router pages
│       ├── components/            # React components
│       ├── lib/                   # Utilities
│       ├── store/                 # Redux store
│       └── package.json
├── packages/
│   ├── shared/                    # Shared TypeScript types
│   └── ui/                        # Shared UI components
├── infrastructure/                # Terraform IaC
├── docs/                          # Documentation
├── docker-compose.yml             # Development environment
└── package.json                   # Root package.json
```

### Key Directories

- **`apps/backend/src/modules/`**: Feature-based modules following NestJS patterns
- **`apps/backend/src/common/`**: Shared utilities, decorators, guards
- **`apps/admin-dashboard/app/`**: Next.js 14+ app router pages
- **`apps/admin-dashboard/components/`**: Reusable React components
- **`packages/shared/`**: TypeScript types shared between frontend and backend

## Development Workflow

### Git Workflow

1. **Branching Strategy:**
   ```bash
   # Main branches
   main        # Production releases
   develop     # Development integration
   
   # Feature branches
   feature/organization-management
   feature/policy-editor
   
   # Hotfix branches
   hotfix/security-patch
   ```

2. **Commit Convention:**
   ```bash
   feat: add bulk organization operations
   fix: resolve policy evaluation caching issue
   docs: update API documentation
   test: add unit tests for ABAC evaluator
   refactor: improve error handling middleware
   ```

3. **Pull Request Process:**
   - Create feature branch from `develop`
   - Implement feature with tests
   - Run linting and tests locally
   - Create PR to `develop` branch
   - Code review and approval
   - Merge to `develop`

### Code Quality

1. **Linting and Formatting:**
   ```bash
   # Backend
   cd apps/backend
   npm run lint          # ESLint
   npm run format        # Prettier
   npm run typecheck     # TypeScript check
   
   # Frontend
   cd apps/admin-dashboard
   npm run lint
   npm run typecheck
   ```

2. **Testing:**
   ```bash
   # Backend
   npm run test          # Unit tests
   npm run test:cov      # With coverage
   npm run test:e2e      # Integration tests
   
   # Frontend
   npm run test
   npm run test:watch
   ```

3. **Pre-commit Hooks:**
   ```bash
   # Install husky for pre-commit hooks
   npm install --save-dev husky lint-staged
   
   # Configure in package.json
   "lint-staged": {
     "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
   }
   ```

## Testing

### Backend Testing

1. **Unit Tests:**
   ```bash
   # Run specific test file
   npm run test src/modules/abac/services/policy-evaluator.service.spec.ts
   
   # Run tests with coverage
   npm run test:cov
   
   # Watch mode for development
   npm run test:watch
   ```

2. **Integration Tests:**
   ```bash
   # Database integration tests
   npm run test:integration
   
   # API endpoint tests
   npm run test test/integration/organizations.integration.spec.ts
   ```

3. **Test Structure:**
   ```typescript
   // Example unit test
   describe('PolicyEvaluatorService', () => {
     let service: PolicyEvaluatorService;
     
     beforeEach(async () => {
       const module = await Test.createTestingModule({
         providers: [PolicyEvaluatorService, ...mockProviders]
       }).compile();
       
       service = module.get<PolicyEvaluatorService>(PolicyEvaluatorService);
     });
     
     it('should evaluate allow policy correctly', async () => {
       const result = await service.evaluate(mockContext);
       expect(result.decision).toBe('allow');
     });
   });
   ```

### Frontend Testing

1. **Component Tests:**
   ```bash
   # React Testing Library tests
   npm run test
   
   # Component interaction tests
   npm run test -- --testNamePattern="OrganizationTree"
   ```

2. **E2E Tests:**
   ```bash
   # Cypress E2E tests
   npm run cypress:open     # Interactive mode
   npm run cypress:run      # Headless mode
   ```

### Test Data

Use the seeder system for consistent test data:

```bash
# Reset and seed database
npm run seed

# Create specific test data
cd apps/backend
npm run migration:run
npm run seed
```

## Deployment

### Environment Configuration

1. **Environment Files:**
   ```bash
   # Development
   .env.dev
   
   # Staging
   .env.stage
   
   # Production
   .env.prod
   ```

2. **Required Environment Variables:**
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=securepassword
   DB_DATABASE=saas_template
   
   # AWS Cognito
   AWS_REGION=us-east-1
   AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
   AWS_COGNITO_CLIENT_ID=xxxxxxxxx
   
   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   
   # Application
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=your-secret-key
   ```

### Docker Deployment

1. **Build Production Images:**
   ```bash
   # Backend
   docker build -f apps/backend/Dockerfile -t saas-backend:latest .
   
   # Frontend
   docker build -f apps/admin-dashboard/Dockerfile -t saas-frontend:latest .
   ```

2. **Production Docker Compose:**
   ```yaml
   # docker-compose.prod.yml
   version: '3.8'
   services:
     backend:
       image: saas-backend:latest
       environment:
         - NODE_ENV=production
       ports:
         - "3000:3000"
     
     frontend:
       image: saas-frontend:latest
       ports:
         - "3001:3000"
   ```

### CI/CD Pipeline

GitHub Actions example:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS
        run: |
          # Deploy using AWS CDK, Terraform, or direct Docker
```

## Architecture Overview

### Backend Architecture

1. **Modular Structure:**
   - Each feature is a separate NestJS module
   - Modules are self-contained with controllers, services, entities
   - Cross-module communication through well-defined interfaces

2. **ABAC System:**
   - Policy-based access control
   - Hierarchical policy inheritance
   - Real-time policy evaluation
   - Caching for performance

3. **Database Design:**
   - PostgreSQL with TypeORM
   - Hierarchical organization structure
   - Audit logging for all changes
   - Optimized queries with indexes

### Frontend Architecture

1. **Next.js 14+ App Router:**
   - Server-side rendering
   - File-based routing
   - API routes for backend communication

2. **State Management:**
   - Redux for global state
   - Zustand for component-local state
   - React Query for server state

3. **UI Components:**
   - shadcn/ui component library
   - Tailwind CSS for styling
   - Responsive design patterns

## Common Development Tasks

### Adding a New Feature Module

1. **Backend Module:**
   ```bash
   cd apps/backend
   nest generate module features/my-feature
   nest generate controller features/my-feature
   nest generate service features/my-feature
   ```

2. **Create Entity:**
   ```typescript
   // src/modules/my-feature/entities/my-feature.entity.ts
   @Entity('my_features')
   export class MyFeature {
     @PrimaryGeneratedColumn('uuid')
     id: string;
     
     @Column()
     name: string;
     
     @ManyToOne(() => Organization)
     organization: Organization;
   }
   ```

3. **Add Migration:**
   ```bash
   npm run migration:generate src/migrations/CreateMyFeature
   npm run migration:run
   ```

### Adding ABAC Policies

1. **Create Policy:**
   ```typescript
   const policy = {
     name: 'My Feature Access',
     resource: 'my-feature:*',
     action: ['read', 'write'],
     effect: 'allow',
     conditions: {
       'subject.attributes.role': { in: ['admin', 'manager'] }
     }
   };
   ```

2. **Apply to Controller:**
   ```typescript
   @Controller('my-feature')
   @UseGuards(JwtAuthGuard, AbacGuard)
   export class MyFeatureController {
     @Get()
     @RequirePermission('my-feature:read')
     findAll() {
       return this.myFeatureService.findAll();
     }
   }
   ```

### Adding Frontend Pages

1. **Create Page:**
   ```typescript
   // apps/admin-dashboard/app/(dashboard)/my-feature/page.tsx
   export default function MyFeaturePage() {
     return (
       <div>
         <h1>My Feature</h1>
         <MyFeatureList />
       </div>
     );
   }
   ```

2. **Add Navigation:**
   ```typescript
   // Update sidebar navigation
   const navigation = [
     { name: 'My Feature', href: '/my-feature', icon: MyIcon }
   ];
   ```

### Database Operations

1. **Create Migration:**
   ```bash
   npm run migration:create src/migrations/AddMyFeatureTable
   ```

2. **Run Migrations:**
   ```bash
   npm run migration:run
   ```

3. **Revert Migration:**
   ```bash
   npm run migration:revert
   ```

### Adding Tests

1. **Unit Test:**
   ```typescript
   // src/modules/my-feature/__tests__/my-feature.service.spec.ts
   describe('MyFeatureService', () => {
     it('should create feature', async () => {
       const result = await service.create(mockData);
       expect(result).toBeDefined();
     });
   });
   ```

2. **Integration Test:**
   ```typescript
   // test/integration/my-feature.integration.spec.ts
   describe('MyFeature API', () => {
     it('should create feature via API', async () => {
       const response = await request(app.getHttpServer())
         .post('/my-feature')
         .send(mockData)
         .expect(201);
     });
   });
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Issues:**
   ```bash
   # Check if PostgreSQL is running
   docker ps | grep postgres
   
   # Check connection
   psql -h localhost -U postgres -d saas_template
   
   # Reset database
   docker-compose down -v
   docker-compose up -d postgres
   ```

2. **Redis Connection Issues:**
   ```bash
   # Check Redis
   docker ps | grep redis
   redis-cli ping
   
   # Clear cache
   redis-cli flushall
   ```

3. **Authentication Issues:**
   ```bash
   # Verify AWS Cognito configuration
   aws cognito-idp describe-user-pool --user-pool-id <pool-id>
   
   # Check JWT token
   # Use jwt.io to decode and verify token
   ```

4. **Build Issues:**
   ```bash
   # Clear dependencies
   rm -rf node_modules package-lock.json
   npm install
   
   # Clear TypeScript cache
   rm -rf apps/backend/dist
   npm run build
   ```

### Performance Optimization

1. **Database Query Optimization:**
   ```typescript
   // Use proper relations and select
   const users = await this.userRepository.find({
     relations: ['memberships', 'memberships.organization'],
     select: ['id', 'email', 'firstName', 'lastName']
   });
   ```

2. **Redis Caching:**
   ```typescript
   // Cache expensive operations
   @LogPerformance(100)
   async expensiveOperation(id: string) {
     return this.cacheService.getOrSet(
       `expensive:${id}`,
       () => this.performExpensiveOperation(id),
       3600000 // 1 hour TTL
     );
   }
   ```

3. **Frontend Performance:**
   ```typescript
   // Use React.memo for expensive components
   const ExpensiveComponent = React.memo(({ data }) => {
     // Expensive rendering logic
   });
   
   // Use useMemo for expensive calculations
   const expensiveValue = useMemo(() => {
     return performExpensiveCalculation(data);
   }, [data]);
   ```

### Debugging

1. **Backend Debugging:**
   ```bash
   # Start in debug mode
   npm run start:debug
   
   # Attach debugger in VS Code
   # Use launch.json configuration
   ```

2. **Database Debugging:**
   ```typescript
   // Enable query logging
   synchronize: false,
   logging: true,
   logger: 'advanced-console'
   ```

3. **Frontend Debugging:**
   ```bash
   # Next.js debugging
   NODE_OPTIONS='--inspect' npm run dev
   
   # Redux DevTools
   # Install Redux DevTools browser extension
   ```

### Getting Help

1. **Documentation:**
   - API docs: `/api/docs`
   - Architecture docs: `/docs/`
   - Component docs: Storybook

2. **Community:**
   - GitHub Issues
   - Discord/Slack channels
   - Stack Overflow tags

3. **Support:**
   - Email: support@your-domain.com
   - Documentation: https://docs.your-domain.com
   - Status page: https://status.your-domain.com