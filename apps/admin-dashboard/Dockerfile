# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/admin-dashboard/package*.json ./apps/admin-dashboard/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev", "--workspace=apps/admin-dashboard"]

# Builder stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/admin-dashboard/package*.json ./apps/admin-dashboard/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build --workspace=apps/admin-dashboard

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install serve to run the application
RUN npm install -g serve

# Copy built application
COPY --from=builder /app/apps/admin-dashboard/.next ./apps/admin-dashboard/.next
COPY --from=builder /app/apps/admin-dashboard/public ./apps/admin-dashboard/public
COPY --from=builder /app/apps/admin-dashboard/package*.json ./apps/admin-dashboard/

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start", "--workspace=apps/admin-dashboard"]