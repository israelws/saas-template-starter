# SaaS Template Starter Kit

A comprehensive multi-organization SaaS template with advanced ABAC (Attribute-Based Access Control) system. Built for enterprise-grade applications with hierarchical organization support and granular permission management.

## 🚀 Features

### Core Features
- **Multi-Organization Support**: Hierarchical organization structures (company → division → department → team)
- **Advanced ABAC System**: Policy-based access control with inheritance and dynamic variable substitution
- **Real-time Updates**: WebSocket integration for live collaboration
- **Field-Level Permissions**: Granular control over data visibility
- **Multi-Role Support**: Users can have multiple roles with priority-based evaluation
- **User Invitation System**: Secure invitation flow with expiry and validation

### Technical Stack
- **Backend**: NestJS with TypeORM and PostgreSQL
- **Frontend**: Next.js 14+ with App Router
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: Redux (Frontend), Redis (Backend caching)
- **Authentication**: AWS Cognito
- **Real-time**: WebSocket.io
- **Styling**: Tailwind CSS with OKLCH color format
- **Development**: Docker Compose for local environment

## 🏃 Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- AWS Account (for Cognito)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd saas-template-starter

# Install dependencies
npm install

# Start development environment
docker-compose up -d

# Run services
npm run backend:dev    # Backend on http://localhost:3002
npm run admin:dev     # Admin Dashboard on http://localhost:3000
```

### Environment Setup

Create `.env.dev` in the root directory:

```env
NODE_ENV=development
DATABASE_URL=postgresql://saas_user:saas_password@localhost:5432/saas_template_db
REDIS_URL=redis://localhost:6379
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=your-pool-id
COGNITO_CLIENT_ID=your-client-id
```

## 📁 Project Structure

```
saas-template-starter/
├── apps/
│   ├── backend/              # NestJS backend application
│   └── admin-dashboard/      # Next.js admin frontend
│       ├── app/              # Next.js App Router
│       ├── src/              # Source code
│       │   ├── components/   # React components
│       │   ├── hooks/        # Custom hooks
│       │   ├── lib/          # Utilities
│       │   └── store/        # Redux store
│       ├── public/           # Static assets
│       └── tests/            # Test files
├── packages/
│   └── shared/               # Shared types and utilities
├── infrastructure/           # Terraform IaC files
├── docker-compose.yml        # Local development
└── tasks/
    └── TODO.md              # Development tasks tracking
```

## 🎨 Key Features

### Policy Management
- Visual policy builder with intuitive UI
- Resource attribute conditions with semantic value selectors
- Real-time policy testing and validation
- Policy inheritance across organization hierarchy

### Organization Management
- Hierarchical organization tree view
- Drag-and-drop organization management
- Cross-organization resource sharing
- Organization-scoped data isolation

### User Management
- Multi-organization membership support
- Role-based and attribute-based access control
- User invitation system with email notifications
- Bulk user operations

### Dark Mode Support
- System/Light/Dark theme options
- Persistent theme selection
- Dynamic logo switching
- OKLCH color format for better color accuracy

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev           # Run all services
npm run backend:dev   # Backend only
npm run admin:dev     # Admin dashboard only

# Testing
npm run test          # Run all tests
npm run test:e2e      # End-to-end tests

# Building
npm run build         # Build all packages
npm run build:backend # Build backend
npm run build:admin   # Build admin dashboard
```

### Database Management

```bash
# Run migrations
npm run migration:run

# Create new migration
npm run migration:create

# Seed demo data
npm run seed
```

## 📚 Documentation

- [Developer Guide](./DEVELOPER_GUIDE.md) - Detailed setup and development instructions
- [API Documentation](http://localhost:3002/api/docs) - Swagger API docs (when backend is running)
- [CLAUDE.md](./CLAUDE.md) - AI assistant instructions and project context

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes following the code style guidelines
3. Write/update tests as needed
4. Submit a pull request to `develop`

## 📝 License

© 2025 Committed Ltd. All rights reserved.