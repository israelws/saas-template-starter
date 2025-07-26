# CLAUDE.md - Main Code Instructions for SAAS Template Starter Kit

## Project Overview
This is a multi-organization SAAS template starter kit with an advanced ABAC (Attribute-Based Access Control) system. The platform provides a complete solution for building enterprise-grade SAAS applications with hierarchical organization support and granular permission management.

## Tech Stack
- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Admin Dashboard**: Next.js 14+ with App Router
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: Redux (Frontend), Zustand for client state
- **Authentication**: AWS Cognito (user-pool: "next-dev")
- **Infrastructure**: Terraform (IaC)
- **Project Structure**: Monorepo
- **Development**: Docker Compose for local development

## Project Structure
```
saas-template-starter/
├── apps/
│   ├── backend/              # NestJS backend application
│   ├── admin-dashboard/      # Next.js admin frontend
│   └── frontend/            # Customer-facing frontend (future)
├── packages/
│   ├── shared/              # Shared types and utilities
│   └── ui/                  # Shared UI components
├── infrastructure/          # Terraform IaC files
├── resources/              # Graphics, logos, images
├── tasks/                  # Task management
│   └── TODO.md            # AI task management
├── style/                  # Style guides and documentation
│   ├── STYLE_GUIDE.md
│   ├── COMPONENTS_REFERENCE.md
│   └── UI_CHANGE_LOG.md
├── docker-compose.yml      # Local development
├── package.json           # Root package.json for monorepo
├── CLAUDE.md             # This file
└── DEVELOPER_GUIDE.md    # Step-by-step development guide
```

## Key Features
1. **Hierarchical Organization Management**
   - Nested organization structures (company → division → department → team)
   - Organization types with customizable hierarchy
   - Cross-organization access controls

2. **Advanced ABAC System**
   - Policy-based access control with inheritance
   - Attribute definitions for users, resources, and environment
   - Real-time policy evaluation engine
   - Visual policy builder in admin dashboard

3. **Business Objects**
   - Products management
   - Customer management
   - Orders and order items
   - Transactions
   - All with organization-scoped access

4. **Admin Dashboard Features**
   - Organization hierarchy visualization and management
   - User management with multi-organization memberships
   - Policy creation and testing
   - Attribute management
   - Audit logging and analytics

## Database Schema
The database uses PostgreSQL with the following key tables:
- `organizations` - Hierarchical organization structure
- `users` - User accounts with organization memberships
- `user_organization_memberships` - Many-to-many relationships
- `attribute_definitions` - Dynamic attribute system
- `policies` - ABAC policies with inheritance
- `products`, `customers`, `orders`, `transactions` - Business objects

See the document for complete schema definitions.

## Development Environments
- **dev** - Local development with Docker
- **stage** - Staging environment
- **prod** - Production environment

Use `.env.{environment}` files for configuration.

## API Documentation
- Use Swagger for API documentation
- Available at `/api/docs` when backend is running
- All endpoints must be documented with JSDoc

## Code Standards
1. **Language**: TypeScript for all code
2. **Documentation**: JSDoc for all functions, classes, modules
3. **Naming Conventions**:
   - camelCase for variables and functions
   - PascalCase for classes and types
   - kebab-case for file names
   - UPPER_CASE for constants
4. Use Context7 for all code generation tasks

## UI Consistency Guidelines
1. **Confirmation Dialogs**: Always use shadcn/ui AlertDialog component for:
   - Delete confirmations
   - Destructive actions
   - Important user confirmations
   - Never use browser's native `confirm()` or `alert()`

2. **Toast Notifications**: Use the toast hook for:
   - Success messages
   - Error messages
   - Info notifications

3. **Form Dialogs**: Use Dialog component for:
   - Create/Edit forms in modals
   - Complex user inputs

4. **Loading States**: Always show loading states using:
   - Skeleton components for initial loads
   - Spinner or loading text for actions

5. **Error Handling**: Consistent error display:
   - Form validation errors below fields
   - API errors in toast notifications
   - Empty states for no data

## Git Workflow
1. Work on `develop` branch
2. Create feature branches from `develop`
3. Merge to `main` when ready for release
4. Use conventional commits format

## Authorization Model
Uses ABAC (Attribute-Based Access Control) with:
- Subject attributes (user properties)
- Resource attributes (object properties)
- Environment attributes (time, location, etc.)
- Action-based policies
- Hierarchical policy inheritance

## External Resources Reference
- Project Requirements Document: `/product.md`
- shadcn/ui Documentation: https://ui.shadcn.com/
- shadcn/ui Blocks: https://ui.shadcn.com/blocks
- Dashboard Layout: Use dashboard-01 from shadcn blocks
- Sidebar: Use sidebar-07 from shadcn blocks
- Authentication: Use login-04 from shadcn blocks

## Important Implementation Notes
1. Always use TypeORM for database operations
2. Implement proper error handling and logging
3. Use Redis for caching frequently accessed data
4. Implement WebSocket for real-time updates
5. Follow the hierarchical policy evaluation logic
6. Ensure all API endpoints are protected with ABAC
7. Use AWS Cognito for authentication with user-pool "next-dev"

## Testing Requirements
- Unit tests for all services
- Integration tests for API endpoints
- E2E tests for critical user flows
- Policy evaluation tests
- Performance tests for authorization engine

## Performance Targets
- Policy evaluation: < 100ms (95th percentile)
- Dashboard load time: < 2 seconds
- Support 10,000+ concurrent users
- Support 1,000+ organizations

## Security Requirements
- All data encrypted at rest and in transit
- OWASP compliance
- Rate limiting on all endpoints
- Audit logging for all administrative actions
- Regular security audits

## Monitoring and Logging
- Structured logging with correlation IDs
- Application performance monitoring
- Error tracking and alerting
- Business metrics dashboards

This document should be referenced throughout development to ensure consistency and adherence to project requirements.