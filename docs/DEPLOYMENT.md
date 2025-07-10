# Deployment Guide

## Overview

This guide covers deploying the SAAS Template Starter Kit to various environments including local development, staging, and production. The application supports deployment to AWS, Google Cloud, Docker containers, and Kubernetes.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Local Development](#local-development)
4. [Docker Deployment](#docker-deployment)
5. [AWS Deployment](#aws-deployment)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: v18.0.0 or higher
- **Docker**: v20.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Redis**: v6.0 or higher
- **AWS CLI**: v2.0 or higher (for AWS deployment)
- **kubectl**: Latest version (for Kubernetes deployment)
- **Terraform**: v1.0 or higher (for infrastructure as code)

### Access Requirements

- AWS Account with appropriate IAM permissions
- PostgreSQL database (RDS or self-hosted)
- Redis instance (ElastiCache or self-hosted)
- Domain name and SSL certificates
- Container registry access (ECR, Docker Hub, etc.)

## Environment Configuration

### Environment Variables

Create environment files for each deployment stage:

#### Production (`.env.prod`)
```env
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DB_HOST=prod-database.cluster-xxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=saas_app
DB_PASSWORD=${DB_PASSWORD}  # Use secrets management
DB_DATABASE=saas_template_prod
DB_SSL=true

# Redis
REDIS_HOST=prod-redis.xxx.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_DB=0
REDIS_TLS=true

# AWS Cognito
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID}
AWS_COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID}
AWS_COGNITO_CLIENT_SECRET=${COGNITO_CLIENT_SECRET}

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=1h

# Application URLs
FRONTEND_URL=https://admin.yourdomain.com
API_URL=https://api.yourdomain.com

# Cache
CACHE_TTL=300000
CACHE_KEY_PREFIX=saas_prod:

# Monitoring
SENTRY_DSN=${SENTRY_DSN}
NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}

# External Services
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=${SMTP_USERNAME}
SMTP_PASSWORD=${SMTP_PASSWORD}
```

#### Staging (`.env.stage`)
```env
# Similar to production but with staging resources
NODE_ENV=staging
DB_HOST=stage-database.cluster-xxx.us-east-1.rds.amazonaws.com
REDIS_HOST=stage-redis.xxx.cache.amazonaws.com
FRONTEND_URL=https://admin-staging.yourdomain.com
API_URL=https://api-staging.yourdomain.com
```

### Secrets Management

**AWS Secrets Manager:**
```bash
# Store database password
aws secretsmanager create-secret \
  --name "saas-template/prod/db-password" \
  --description "Production database password" \
  --secret-string "your-secure-password"

# Store JWT secret
aws secretsmanager create-secret \
  --name "saas-template/prod/jwt-secret" \
  --secret-string "your-jwt-secret-key"
```

**Kubernetes Secrets:**
```yaml
# k8s-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: saas-template-secrets
type: Opaque
data:
  db-password: <base64-encoded-password>
  jwt-secret: <base64-encoded-secret>
  cognito-client-secret: <base64-encoded-secret>
```

## Local Development

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: saas_template_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    depends_on:
      - postgres
      - redis
    volumes:
      - ./apps/backend:/app
      - /app/node_modules

  frontend:
    build:
      context: .
      dockerfile: apps/admin-dashboard/Dockerfile.dev
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./apps/admin-dashboard:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

### Quick Start Commands

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f backend

# Run migrations
docker-compose exec backend npm run migration:run

# Seed database
docker-compose exec backend npm run seed

# Stop environment
docker-compose down
```

## Docker Deployment

### Production Dockerfiles

#### Backend Dockerfile
```dockerfile
# apps/backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runtime

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package*.json ./

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["node", "dist/main.js"]
```

#### Frontend Dockerfile
```dockerfile
# apps/admin-dashboard/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY apps/admin-dashboard/package*.json ./apps/admin-dashboard/
RUN npm ci

COPY apps/admin-dashboard ./apps/admin-dashboard
WORKDIR /app/apps/admin-dashboard
RUN npm run build

FROM node:18-alpine AS runtime

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

COPY --from=builder /app/apps/admin-dashboard/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-dashboard/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    image: your-registry/saas-backend:${VERSION}
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.prod
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    image: your-registry/saas-frontend:${VERSION}
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
```

### Build and Deploy Scripts

```bash
#!/bin/bash
# scripts/deploy-docker.sh

set -e

VERSION=${1:-latest}
REGISTRY=${2:-your-docker-registry.com}

echo "Building images for version: $VERSION"

# Build backend
docker build -f apps/backend/Dockerfile -t $REGISTRY/saas-backend:$VERSION .
docker push $REGISTRY/saas-backend:$VERSION

# Build frontend
docker build -f apps/admin-dashboard/Dockerfile -t $REGISTRY/saas-frontend:$VERSION .
docker push $REGISTRY/saas-frontend:$VERSION

echo "Deploying version $VERSION"

# Deploy to production
VERSION=$VERSION docker-compose -f docker-compose.prod.yml up -d

echo "Deployment complete"
```

## AWS Deployment

### Infrastructure as Code (Terraform)

```hcl
# infrastructure/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "saas-template-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier = "saas-template-db"
  
  engine         = "postgres"
  engine_version = "14.9"
  instance_class = "db.t3.medium"
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_encrypted     = true
  
  db_name  = "saas_template"
  username = "saas_app"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  deletion_protection = true
  
  tags = local.common_tags
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "saas-template-cache-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "saas-template-redis"
  description                = "Redis cluster for SAAS Template"
  
  node_type                  = "cache.t3.micro"
  port                       = 6379
  parameter_group_name       = "default.redis7"
  
  num_cache_clusters         = 2
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = local.common_tags
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "saas-template-cluster"
  
  configuration {
    execute_command_configuration {
      logging    = "OVERRIDE"
      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs.name
      }
    }
  }
  
  tags = local.common_tags
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "saas-template-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
  
  enable_deletion_protection = true
  
  tags = local.common_tags
}
```

### ECS Task Definitions

```json
{
  "family": "saas-template-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.us-east-1.amazonaws.com/saas-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"}
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:account:secret:saas-template/prod/db-password"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:account:secret:saas-template/prod/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/saas-template-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Deployment Scripts

```bash
#!/bin/bash
# scripts/deploy-aws.sh

set -e

AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REGISTRY=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
VERSION=${1:-latest}

echo "Deploying to AWS ECS..."

# Build and push images
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

docker build -f apps/backend/Dockerfile -t $ECR_REGISTRY/saas-backend:$VERSION .
docker push $ECR_REGISTRY/saas-backend:$VERSION

docker build -f apps/admin-dashboard/Dockerfile -t $ECR_REGISTRY/saas-frontend:$VERSION .
docker push $ECR_REGISTRY/saas-frontend:$VERSION

# Update ECS services
aws ecs update-service \
  --cluster saas-template-cluster \
  --service saas-template-backend \
  --force-new-deployment

aws ecs update-service \
  --cluster saas-template-cluster \
  --service saas-template-frontend \
  --force-new-deployment

echo "Deployment initiated. Check ECS console for progress."
```

## Kubernetes Deployment

### Kubernetes Manifests

#### Namespace and ConfigMap
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: saas-template

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: saas-template-config
  namespace: saas-template
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
  REDIS_PORT: "6379"
  DB_PORT: "5432"
```

#### Secrets
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: saas-template-secrets
  namespace: saas-template
type: Opaque
data:
  db-password: <base64-encoded>
  jwt-secret: <base64-encoded>
  redis-password: <base64-encoded>
```

#### Backend Deployment
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: saas-template-backend
  namespace: saas-template
spec:
  replicas: 3
  selector:
    matchLabels:
      app: saas-template-backend
  template:
    metadata:
      labels:
        app: saas-template-backend
    spec:
      containers:
      - name: backend
        image: your-registry/saas-backend:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: saas-template-config
        env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: saas-template-secrets
              key: db-password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: saas-template-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: saas-template-backend-service
  namespace: saas-template
spec:
  selector:
    app: saas-template-backend
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

#### Ingress
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: saas-template-ingress
  namespace: saas-template
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    - admin.yourdomain.com
    secretName: saas-template-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: saas-template-backend-service
            port:
              number: 80
  - host: admin.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: saas-template-frontend-service
            port:
              number: 80
```

### Helm Chart

```yaml
# helm/saas-template/Chart.yaml
apiVersion: v2
name: saas-template
description: SAAS Template Starter Kit Helm Chart
type: application
version: 0.1.0
appVersion: "1.0.0"

# helm/saas-template/values.yaml
replicaCount: 3

image:
  backend:
    repository: your-registry/saas-backend
    tag: latest
    pullPolicy: IfNotPresent
  frontend:
    repository: your-registry/saas-frontend
    tag: latest
    pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: api.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
    - host: admin.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: saas-template-tls
      hosts:
        - api.yourdomain.com
        - admin.yourdomain.com

resources:
  limits:
    cpu: 500m
    memory: 1Gi
  requests:
    cpu: 250m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test
    
    - name: Run type check
      run: npm run typecheck
    
    - name: Run linting
      run: npm run lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push backend image
      run: |
        docker build -f apps/backend/Dockerfile -t $ECR_REGISTRY/saas-backend:$GITHUB_SHA .
        docker push $ECR_REGISTRY/saas-backend:$GITHUB_SHA
        docker tag $ECR_REGISTRY/saas-backend:$GITHUB_SHA $ECR_REGISTRY/saas-backend:latest
        docker push $ECR_REGISTRY/saas-backend:latest
    
    - name: Build and push frontend image
      run: |
        docker build -f apps/admin-dashboard/Dockerfile -t $ECR_REGISTRY/saas-frontend:$GITHUB_SHA .
        docker push $ECR_REGISTRY/saas-frontend:$GITHUB_SHA
        docker tag $ECR_REGISTRY/saas-frontend:$GITHUB_SHA $ECR_REGISTRY/saas-frontend:latest
        docker push $ECR_REGISTRY/saas-frontend:latest
    
    - name: Deploy to ECS
      run: |
        aws ecs update-service --cluster saas-template-cluster --service saas-template-backend --force-new-deployment
        aws ecs update-service --cluster saas-template-cluster --service saas-template-frontend --force-new-deployment
    
    - name: Wait for deployment
      run: |
        aws ecs wait services-stable --cluster saas-template-cluster --services saas-template-backend
        aws ecs wait services-stable --cluster saas-template-cluster --services saas-template-frontend
```

## Monitoring and Logging

### CloudWatch Configuration

```yaml
# cloudformation/monitoring.yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Monitoring and logging for SAAS Template'

Resources:
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ecs/saas-template-${Environment}'
      RetentionInDays: 14

  DatabaseAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: 'RDS CPU Utilization'
      MetricName: CPUUtilization
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: DBInstanceIdentifier
          Value: !Ref DatabaseInstance

  ApplicationDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub 'SAAS-Template-${Environment}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/ECS", "CPUUtilization", "ServiceName", "saas-template-backend"],
                  [".", "MemoryUtilization", ".", "."]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "ECS Metrics"
              }
            }
          ]
        }
```

### Application Monitoring

```typescript
// src/common/monitoring/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, register } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
  });

  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 5, 15, 50, 100, 500]
  });

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode });
    this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
```

## Security Considerations

### Security Checklist

1. **Environment Variables:**
   - Use secrets management (AWS Secrets Manager, K8s Secrets)
   - Never commit secrets to version control
   - Rotate secrets regularly

2. **Database Security:**
   - Enable SSL/TLS encryption
   - Use VPC security groups
   - Regular security updates
   - Backup encryption

3. **Application Security:**
   - Enable CORS with specific origins
   - Implement rate limiting
   - Use HTTPS everywhere
   - Input validation and sanitization
   - SQL injection prevention

4. **Infrastructure Security:**
   - VPC with private subnets
   - Security groups with minimal access
   - WAF protection
   - Regular security audits

### Security Configuration

```typescript
// src/main.ts security configuration
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));
  
  // Compression
  app.use(compression());
  
  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });
  
  await app.listen(3000);
}
```

## Troubleshooting

### Common Deployment Issues

1. **Database Connection Issues:**
   ```bash
   # Check database connectivity
   docker run --rm postgres:14 psql -h $DB_HOST -U $DB_USERNAME -d $DB_DATABASE -c "SELECT 1;"
   
   # Check security groups
   aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx
   ```

2. **Container Issues:**
   ```bash
   # Check container logs
   docker logs container-id
   
   # Execute into container
   docker exec -it container-id /bin/sh
   
   # Check ECS service events
   aws ecs describe-services --cluster cluster-name --services service-name
   ```

3. **SSL/TLS Issues:**
   ```bash
   # Check certificate
   openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
   
   # Verify certificate chain
   ssl-checker yourdomain.com
   ```

4. **Performance Issues:**
   ```bash
   # Check resource usage
   docker stats
   
   # Monitor database performance
   aws rds describe-db-log-files --db-instance-identifier your-db
   
   # Check application metrics
   curl http://localhost:3000/metrics
   ```

### Health Checks

```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.checkRedis(),
      () => this.checkExternalServices(),
    ]);
  }

  private async checkRedis() {
    // Redis health check implementation
  }

  private async checkExternalServices() {
    // External service health checks
  }
}
```

This deployment guide provides comprehensive coverage for deploying the SAAS Template Starter Kit to various environments with proper security, monitoring, and troubleshooting procedures.