#!/bin/bash

# Production Deployment Script for SAAS Template Starter
# This script deploys the application to production environment

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="production"
REGISTRY="ghcr.io/your-org/saas-template-starter"
VERSION="${1:-latest}"

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
    log_info "Running pre-deployment checks..."
    
    # Check required commands
    check_command "docker"
    check_command "kubectl"
    check_command "helm"
    
    # Check if we're on the correct branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        log_warning "Not on main branch. Current branch: $CURRENT_BRANCH"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Deployment cancelled."
            exit 1
        fi
    fi
    
    # Check if working directory is clean
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "Working directory is not clean."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Deployment cancelled."
            exit 1
        fi
    fi
    
    # Check Kubernetes context
    CURRENT_CONTEXT=$(kubectl config current-context)
    log_info "Current Kubernetes context: $CURRENT_CONTEXT"
    read -p "Is this the correct production context? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Please switch to the correct Kubernetes context."
        exit 1
    fi
    
    log_success "Pre-deployment checks passed."
}

# Build and push Docker images
build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    cd "$PROJECT_ROOT"
    
    # Build backend image
    log_info "Building backend image..."
    docker build -f apps/backend/Dockerfile -t "$REGISTRY/backend:$VERSION" .
    docker push "$REGISTRY/backend:$VERSION"
    
    # Build frontend image
    log_info "Building frontend image..."
    docker build -f apps/admin-dashboard/Dockerfile -t "$REGISTRY/frontend:$VERSION" .
    docker push "$REGISTRY/frontend:$VERSION"
    
    # Tag as latest if deploying from main
    if [ "$CURRENT_BRANCH" = "main" ]; then
        docker tag "$REGISTRY/backend:$VERSION" "$REGISTRY/backend:latest"
        docker tag "$REGISTRY/frontend:$VERSION" "$REGISTRY/frontend:latest"
        docker push "$REGISTRY/backend:latest"
        docker push "$REGISTRY/frontend:latest"
    fi
    
    log_success "Images built and pushed successfully."
}

# Deploy to Kubernetes
deploy_kubernetes() {
    log_info "Deploying to Kubernetes..."
    
    cd "$PROJECT_ROOT"
    
    # Create namespace if it doesn't exist
    kubectl create namespace saas-template --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply secrets (assumes they're already created)
    log_info "Checking secrets..."
    if ! kubectl get secret saas-secrets -n saas-template &> /dev/null; then
        log_error "Secret 'saas-secrets' not found. Please create it first."
        exit 1
    fi
    
    # Apply Kubernetes manifests
    log_info "Applying Kubernetes manifests..."
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/backend-deployment.yaml
    kubectl apply -f k8s/frontend-deployment.yaml
    kubectl apply -f k8s/ingress.yaml
    
    # Wait for deployments to be ready
    log_info "Waiting for deployments to be ready..."
    kubectl rollout status deployment/saas-backend -n saas-template --timeout=300s
    kubectl rollout status deployment/saas-frontend -n saas-template --timeout=300s
    
    log_success "Kubernetes deployment completed."
}

# Deploy with Helm (alternative to kubectl)
deploy_helm() {
    log_info "Deploying with Helm..."
    
    cd "$PROJECT_ROOT"
    
    # Check if Helm chart exists
    if [ ! -d "helm/saas-template" ]; then
        log_error "Helm chart not found at helm/saas-template"
        exit 1
    fi
    
    # Deploy or upgrade
    helm upgrade --install saas-template-prod ./helm/saas-template \
        --namespace saas-template \
        --create-namespace \
        --set image.backend.tag="$VERSION" \
        --set image.frontend.tag="$VERSION" \
        --set environment="production" \
        --wait \
        --timeout=10m
    
    log_success "Helm deployment completed."
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Get backend pod name
    BACKEND_POD=$(kubectl get pods -n saas-template -l app=saas-backend -o jsonpath='{.items[0].metadata.name}')
    
    if [ -z "$BACKEND_POD" ]; then
        log_error "No backend pod found."
        exit 1
    fi
    
    # Run migrations
    kubectl exec -n saas-template "$BACKEND_POD" -- npm run migration:run
    
    log_success "Database migrations completed."
}

# Health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Check if services are responding
    API_URL="https://api.yourdomain.com"
    FRONTEND_URL="https://admin.yourdomain.com"
    
    # Test API health
    if curl -f -s "$API_URL/health" > /dev/null; then
        log_success "API health check passed."
    else
        log_error "API health check failed."
        exit 1
    fi
    
    # Test frontend health
    if curl -f -s "$FRONTEND_URL" > /dev/null; then
        log_success "Frontend health check passed."
    else
        log_error "Frontend health check failed."
        exit 1
    fi
    
    log_success "All health checks passed."
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    # Rollback Kubernetes deployments
    kubectl rollout undo deployment/saas-backend -n saas-template
    kubectl rollout undo deployment/saas-frontend -n saas-template
    
    # Wait for rollback to complete
    kubectl rollout status deployment/saas-backend -n saas-template
    kubectl rollout status deployment/saas-frontend -n saas-template
    
    log_success "Rollback completed."
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # Remove old Docker images
    docker image prune -f
    
    log_success "Cleanup completed."
}

# Main deployment function
main() {
    log_info "Starting production deployment for version: $VERSION"
    
    # Trap errors and rollback if needed
    trap 'log_error "Deployment failed. Consider running rollback."; exit 1' ERR
    
    pre_deployment_checks
    build_and_push_images
    
    # Choose deployment method
    if [ "$2" = "--helm" ]; then
        deploy_helm
    else
        deploy_kubernetes
    fi
    
    run_migrations
    run_health_checks
    cleanup
    
    log_success "Production deployment completed successfully!"
    log_info "API: https://api.yourdomain.com"
    log_info "Admin Dashboard: https://admin.yourdomain.com"
}

# Script options
case "$2" in
    --rollback)
        rollback
        exit 0
        ;;
    --health-check)
        run_health_checks
        exit 0
        ;;
    --help)
        echo "Usage: $0 [VERSION] [OPTIONS]"
        echo "Options:"
        echo "  --helm          Use Helm for deployment instead of kubectl"
        echo "  --rollback      Rollback the last deployment"
        echo "  --health-check  Run health checks only"
        echo "  --help          Show this help message"
        exit 0
        ;;
esac

# Run main deployment
main "$@"