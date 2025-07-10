#!/bin/bash

# SAAS Template Quick Setup Script

echo "🚀 SAAS Template Starter Kit - Initial Setup"
echo "==========================================="

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment files
echo "📋 Setting up environment files..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please update .env with your AWS Cognito credentials"
else
    echo "✅ .env file already exists"
fi

if [ ! -f apps/backend/.env.dev ]; then
    echo "✅ apps/backend/.env.dev already exists"
fi

if [ ! -f apps/admin-dashboard/.env.local ]; then
    echo "✅ apps/admin-dashboard/.env.local already exists"
fi

# Start Docker services
echo ""
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if PostgreSQL is ready
until docker-compose exec -T postgres pg_isready -U postgres -d saas_template &>/dev/null; do
    echo "⏳ PostgreSQL is not ready yet. Waiting..."
    sleep 2
done

echo "✅ PostgreSQL is ready"

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
cd apps/backend
npm run migration:run
cd ../..

# Seed database
echo ""
echo "🌱 Seeding database..."
cd apps/backend
npm run seed
cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update .env with your AWS Cognito credentials"
echo "2. Run 'docker-compose up' to start all services"
echo "3. Access the admin dashboard at http://localhost:3001"
echo "4. Access the API at http://localhost:3000"
echo "5. View API docs at http://localhost:3000/api/docs"
echo ""
echo "Demo users (after seeding):"
echo "- Admin: admin@techcorp.com"
echo "- Manager: sarah.manager@techcorp.com"
echo "- Employee: mike.employee@techcorp.com"