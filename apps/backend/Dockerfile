# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build --workspace=apps/backend

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY --from=development /app/apps/backend/dist ./apps/backend/dist

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "apps/backend/dist/main"]