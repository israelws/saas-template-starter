#!/bin/bash

# Staging Deployment Script for SAAS Template Starter
# This script deploys the application to staging environment

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="staging"
REGISTRY="ghcr.io/your-org/saas-template-starter"
VERSION="${1:-develop}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is required but not installed."
        exit 1
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks for staging..."
    
    # Check required commands
    check_command "docker"
    check_command "docker-compose"
    
    # Check if we have staging environment files
    if [ ! -f "$PROJECT_ROOT/.env.staging" ]; then
        log_warning ".env.staging file not found. Creating from template..."
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env.staging"
        log_warning "Please update .env.staging with staging configuration."
    fi
    
    log_success "Pre-deployment checks passed."
}

# Build and deploy with Docker Compose
deploy_docker_compose() {
    log_info "Deploying to staging with Docker Compose..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest images if available
    log_info "Pulling latest images..."
    docker-compose -f docker-compose.staging.yml pull || true
    
    # Build and start services
    log_info "Building and starting services..."
    docker-compose -f docker-compose.staging.yml up -d --build
    
    log_success "Staging deployment with Docker Compose completed."
}

# Alternative: Deploy to staging Kubernetes namespace
deploy_kubernetes_staging() {
    log_info "Deploying to Kubernetes staging namespace..."
    
    cd "$PROJECT_ROOT"
    
    # Create staging namespace
    kubectl create namespace saas-template-staging --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply staging-specific manifests
    # Update image tags to use develop/staging versions
    sed "s|:latest|:$VERSION|g" k8s/backend-deployment.yaml | \
    sed "s|namespace: saas-template|namespace: saas-template-staging|g" | \
    kubectl apply -f -
    
    sed "s|:latest|:$VERSION|g" k8s/frontend-deployment.yaml | \
    sed "s|namespace: saas-template|namespace: saas-template-staging|g" | \
    kubectl apply -f -
    
    # Apply ingress with staging domains
    sed "s|yourdomain.com|staging.yourdomain.com|g" k8s/ingress.yaml | \
    sed "s|namespace: saas-template|namespace: saas-template-staging|g" | \
    kubectl apply -f -
    
    # Wait for deployments
    kubectl rollout status deployment/saas-backend -n saas-template-staging --timeout=300s
    kubectl rollout status deployment/saas-frontend -n saas-template-staging --timeout=300s
    
    log_success "Kubernetes staging deployment completed."
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations for staging..."
    
    if command -v kubectl &> /dev/null && kubectl get namespace saas-template-staging &> /dev/null; then
        # Kubernetes deployment
        BACKEND_POD=$(kubectl get pods -n saas-template-staging -l app=saas-backend -o jsonpath='{.items[0].metadata.name}')
        if [ -n "$BACKEND_POD" ]; then
            kubectl exec -n saas-template-staging "$BACKEND_POD" -- npm run migration:run
        fi
    else
        # Docker Compose deployment
        docker-compose -f docker-compose.staging.yml exec backend npm run migration:run
    fi
    
    log_success "Database migrations completed."
}

# Seed staging data
seed_staging_data() {
    log_info "Seeding staging database with demo data..."
    
    if command -v kubectl &> /dev/null && kubectl get namespace saas-template-staging &> /dev/null; then
        # Kubernetes deployment
        BACKEND_POD=$(kubectl get pods -n saas-template-staging -l app=saas-backend -o jsonpath='{.items[0].metadata.name}')
        if [ -n "$BACKEND_POD" ]; then
            kubectl exec -n saas-template-staging "$BACKEND_POD" -- npm run seed
        fi
    else
        # Docker Compose deployment
        docker-compose -f docker-compose.staging.yml exec backend npm run seed
    fi
    
    log_success "Staging data seeded successfully."
}

# Health checks
run_health_checks() {
    log_info "Running health checks for staging..."
    
    # URLs for staging
    API_URL="http://localhost:3000"
    FRONTEND_URL="http://localhost:3001"
    
    # If using Kubernetes with ingress
    if command -v kubectl &> /dev/null && kubectl get namespace saas-template-staging &> /dev/null; then
        API_URL="https://api-staging.yourdomain.com"
        FRONTEND_URL="https://admin-staging.yourdomain.com"
    fi
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Test API health
    RETRIES=5
    for i in $(seq 1 $RETRIES); do
        if curl -f -s "$API_URL/health" > /dev/null; then
            log_success "API health check passed."
            break
        else
            if [ $i -eq $RETRIES ]; then
                log_error "API health check failed after $RETRIES attempts."
                exit 1
            else
                log_warning "API health check attempt $i failed. Retrying..."
                sleep 10
            fi
        fi
    done
    
    # Test frontend health
    for i in $(seq 1 $RETRIES); do
        if curl -f -s "$FRONTEND_URL" > /dev/null; then
            log_success "Frontend health check passed."
            break
        else
            if [ $i -eq $RETRIES ]; then
                log_error "Frontend health check failed after $RETRIES attempts."
                exit 1
            else
                log_warning "Frontend health check attempt $i failed. Retrying..."
                sleep 10
            fi
        fi
    done
    
    log_success "All health checks passed."
}

# Show staging environment info
show_staging_info() {
    log_info "Staging environment information:"
    
    if command -v kubectl &> /dev/null && kubectl get namespace saas-template-staging &> /dev/null; then
        echo "🔗 API: https://api-staging.yourdomain.com"
        echo "🔗 Admin Dashboard: https://admin-staging.yourdomain.com"
        echo ""
        echo "Kubernetes Pods:"
        kubectl get pods -n saas-template-staging
    else
        echo "🔗 API: http://localhost:3000"
        echo "🔗 Admin Dashboard: http://localhost:3001"
        echo "🔗 API Documentation: http://localhost:3000/api/docs"
        echo ""
        echo "Docker Containers:"
        docker-compose -f docker-compose.staging.yml ps
    fi
    
    echo ""
    echo "Demo Users (after seeding):"
    echo "- admin@techcorp.com (password: Admin123!)"
    echo "- manager@techcorp.com (password: Manager123!)"
    echo "- user@techcorp.com (password: User123!)"
}

# Cleanup staging environment
cleanup_staging() {
    log_info "Cleaning up staging environment..."
    
    if [ "$1" = "--kubernetes" ]; then
        kubectl delete namespace saas-template-staging --ignore-not-found=true
        log_success "Kubernetes staging namespace deleted."
    else
        docker-compose -f docker-compose.staging.yml down -v
        docker image prune -f
        log_success "Docker Compose staging environment cleaned up."
    fi
}

# Main deployment function
main() {
    log_info "Starting staging deployment for version: $VERSION"
    
    pre_deployment_checks
    
    # Choose deployment method
    if [ "$2" = "--kubernetes" ]; then
        deploy_kubernetes_staging
    else
        deploy_docker_compose
    fi
    
    run_migrations
    seed_staging_data
    run_health_checks
    show_staging_info
    
    log_success "Staging deployment completed successfully!"
}

# Script options
case "$2" in
    --cleanup)
        cleanup_staging "$3"
        exit 0
        ;;
    --health-check)
        run_health_checks
        exit 0
        ;;
    --info)
        show_staging_info
        exit 0
        ;;
    --help)
        echo "Usage: $0 [VERSION] [OPTIONS]"
        echo "Options:"
        echo "  --kubernetes    Deploy to Kubernetes staging namespace"
        echo "  --cleanup       Clean up staging environment"
        echo "  --health-check  Run health checks only"
        echo "  --info          Show staging environment information"
        echo "  --help          Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                           # Deploy with Docker Compose using develop tag"
        echo "  $0 feature-branch            # Deploy specific version"
        echo "  $0 develop --kubernetes      # Deploy to Kubernetes"
        echo "  $0 --cleanup                 # Clean up Docker Compose"
        echo "  $0 --cleanup --kubernetes    # Clean up Kubernetes"
        exit 0
        ;;
esac

# Run main deployment
main "$@"