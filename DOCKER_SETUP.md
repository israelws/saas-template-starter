# Docker Setup Guide

## Prerequisites
- Docker Desktop installed and running
- Node.js 20+ (for local development)
- AWS Cognito User Pool configured

## Quick Start

1. **Copy environment files:**
   ```bash
   cp .env.example .env
   # Update .env with your AWS Cognito credentials
   ```

2. **Start all services:**
   ```bash
   docker-compose up
   ```

   This will start:
   - PostgreSQL (port 5432)
   - Redis (port 6379)
   - Backend API (port 3000)
   - Admin Dashboard (port 3001)

3. **Run database migrations:**
   ```bash
   docker-compose exec backend npm run migration:run --workspace=@saas-template/backend
   ```

4. **Seed the database (optional):**
   ```bash
   docker-compose exec backend npm run seed --workspace=@saas-template/backend
   ```

## Available Services

### Backend API
- URL: http://localhost:3000
- Swagger Docs: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/health

### Admin Dashboard
- URL: http://localhost:3001
- Default login: Use seeded user credentials

### PostgreSQL Database
- Host: localhost
- Port: 5432
- Database: saas_template
- Username: postgres
- Password: postgres

### Redis
- Host: localhost
- Port: 6379

## Common Commands

### Start services in detached mode:
```bash
docker-compose up -d
```

### Stop all services:
```bash
docker-compose down
```

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f admin-dashboard
```

### Execute commands in containers:
```bash
# Backend commands
docker-compose exec backend npm run migration:generate --workspace=@saas-template/backend -- -n MigrationName
docker-compose exec backend npm run test --workspace=@saas-template/backend

# Admin dashboard commands
docker-compose exec admin-dashboard npm run build --workspace=@saas-template/admin-dashboard
```

### Reset database:
```bash
docker-compose down -v
docker-compose up postgres -d
docker-compose exec backend npm run migration:run --workspace=@saas-template/backend
docker-compose exec backend npm run seed --workspace=@saas-template/backend
```

## Development Workflow

1. **Make code changes** - Files are mounted as volumes, so changes are reflected immediately
2. **Backend changes** - NestJS runs in watch mode, automatically reloading
3. **Frontend changes** - Next.js has hot module replacement enabled
4. **Database changes** - Generate and run migrations as needed

## Troubleshooting

### Port already in use
If you get port conflicts, either:
- Stop the conflicting service
- Or change ports in docker-compose.yml and update .env files

### Database connection issues
1. Ensure PostgreSQL container is healthy:
   ```bash
   docker-compose ps
   ```
2. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

### Cannot connect to AWS Cognito
1. Verify your .env file has correct Cognito credentials
2. Ensure your AWS region is correct
3. Check backend logs for specific errors

### Container startup order issues
The docker-compose file includes health checks and depends_on configurations to ensure proper startup order. If issues persist:
```bash
docker-compose down
docker-compose up postgres redis -d
# Wait for them to be healthy
docker-compose up backend -d
docker-compose up admin-dashboard -d
```

## Production Deployment

For production, use the production stage in Dockerfiles:
```bash
docker build -t saas-backend:prod --target production -f apps/backend/Dockerfile .
docker build -t saas-admin:prod --target production -f apps/admin-dashboard/Dockerfile .
```

Remember to:
- Use proper environment variables
- Set up proper networking
- Configure SSL/TLS
- Use managed database services
- Set up monitoring and logging