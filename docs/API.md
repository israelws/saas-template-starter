# API Documentation

## Overview

The SAAS Template Starter Kit provides a comprehensive REST API for managing multi-organizational hierarchies with Attribute-Based Access Control (ABAC). The API is built with NestJS and follows OpenAPI specifications.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Staging**: `https://api-staging.your-domain.com/api`
- **Production**: `https://api.your-domain.com/api`

## Authentication

All API endpoints require JWT authentication via AWS Cognito. Include the access token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

## API Documentation

Interactive API documentation is available at:
- **Development**: `http://localhost:3000/api/docs`
- **Swagger JSON**: `http://localhost:3000/api/docs-json`

## Core Modules

### 1. Authentication (`/auth`)

#### POST `/auth/login`
Authenticate user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "active"
  }
}
```

#### POST `/auth/register`
Register a new user account.

#### POST `/auth/refresh`
Refresh expired access token.

#### POST `/auth/logout`
Invalidate user session.

#### POST `/auth/forgot-password`
Initiate password reset flow.

#### POST `/auth/reset-password`
Complete password reset with confirmation code.

### 2. Organizations (`/organizations`)

#### GET `/organizations`
Retrieve paginated list of organizations with filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `name` (string): Filter by organization name
- `type` (string): Filter by organization type
- `status` (string): Filter by status
- `parentId` (string): Filter by parent organization

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "TechCorp Global",
      "code": "TECHCORP",
      "description": "Global technology corporation",
      "type": "company",
      "status": "active",
      "settings": {
        "industry": "technology",
        "employees": 5000
      },
      "parent": null,
      "children": [],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

#### POST `/organizations`
Create a new organization.

**Request:**
```json
{
  "name": "New Organization",
  "code": "NEW_ORG",
  "description": "Organization description",
  "type": "company",
  "parentId": "uuid",
  "settings": {
    "industry": "technology"
  }
}
```

#### GET `/organizations/:id`
Retrieve organization by ID with relationships.

#### PATCH `/organizations/:id`
Update organization details.

#### DELETE `/organizations/:id`
Soft delete organization (archives it).

#### GET `/organizations/:id/hierarchy`
Get complete organization hierarchy tree.

#### PATCH `/organizations/:id/move`
Move organization to new parent.

#### POST `/organizations/bulk`
Create multiple organizations in batch.

### 3. Users (`/users`)

#### GET `/users`
Retrieve paginated list of users with filtering.

**Query Parameters:**
- `page`, `limit`: Pagination
- `email`: Filter by email
- `status`: Filter by status
- `organizationId`: Filter by organization membership
- `role`: Filter by role in organization

#### POST `/users`
Create new user account.

#### GET `/users/:id`
Retrieve user by ID with organization memberships.

#### PATCH `/users/:id`
Update user details.

#### DELETE `/users/:id`
Soft delete user account.

#### POST `/users/:userId/organizations/:organizationId`
Add user to organization with specific role.

#### DELETE `/users/:userId/organizations/:organizationId`
Remove user from organization.

#### PATCH `/users/:userId/organizations/:organizationId/role`
Update user's role in organization.

#### GET `/users/:id/organizations`
Get user's organization memberships.

#### GET `/users/search`
Search users by name, email, or attributes.

### 4. ABAC Policies (`/policies`)

#### GET `/policies`
Retrieve policies with filtering by organization, resource, action.

#### POST `/policies`
Create new ABAC policy.

**Request:**
```json
{
  "name": "Admin Full Access",
  "description": "Administrators have full access",
  "resource": "organization:*",
  "action": ["read", "write", "delete"],
  "effect": "allow",
  "conditions": {
    "subject.attributes.role": { "equals": "admin" },
    "subject.attributes.clearanceLevel": { "in": ["high", "top-secret"] }
  },
  "priority": 100,
  "organizationId": "uuid",
  "policySetId": "uuid"
}
```

#### GET `/policies/:id`
Retrieve policy by ID.

#### PATCH `/policies/:id`
Update policy details.

#### DELETE `/policies/:id`
Delete policy.

#### POST `/policies/evaluate`
Evaluate policies against context.

**Request:**
```json
{
  "subject": {
    "id": "user-123",
    "attributes": {
      "role": "admin",
      "clearanceLevel": "high"
    }
  },
  "resource": {
    "type": "organization",
    "id": "org-123",
    "attributes": {
      "classification": "internal"
    }
  },
  "action": "read",
  "environment": {
    "time": "14:30",
    "location": { "country": "US" }
  }
}
```

**Response:**
```json
{
  "decision": "allow",
  "appliedPolicy": {
    "id": "policy-123",
    "name": "Admin Full Access"
  },
  "evaluationTime": 45,
  "reason": "Policy conditions matched"
}
```

#### POST `/policies/test`
Test policy against sample contexts.

### 5. Attribute Definitions (`/attributes`)

#### GET `/attributes`
Retrieve attribute definitions for organization.

#### POST `/attributes`
Create new attribute definition.

#### GET `/attributes/:id`
Retrieve attribute definition by ID.

#### PATCH `/attributes/:id`
Update attribute definition.

#### DELETE `/attributes/:id`
Delete attribute definition.

### 6. Business Objects

#### Products (`/products`)
- Standard CRUD operations
- Organization-scoped access
- Inventory management
- Bulk operations

#### Customers (`/customers`)
- Customer management
- Organization relationships
- Contact information
- Account balances

#### Orders (`/orders`)
- Order creation and management
- Order item handling
- Status tracking
- Organization-based access

#### Transactions (`/transactions`)
- Financial transaction records
- Payment processing integration
- Transaction history
- Audit trails

## Error Handling

All API endpoints return standardized error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email format is invalid"
    }
  ],
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/users"
}
```

## Common HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied by ABAC policies
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `422 Unprocessable Entity`: Business logic error
- `500 Internal Server Error`: Server error

## Rate Limiting

API endpoints are rate limited:
- **Authenticated users**: 1000 requests per hour
- **Admin users**: 5000 requests per hour
- **Bulk operations**: 100 requests per hour

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

## Pagination

List endpoints support pagination with consistent response format:

**Query Parameters:**
- `page`: Page number (1-based)
- `limit`: Items per page (max 100)
- `sort`: Sort field
- `order`: Sort direction (asc/desc)

**Response:**
```json
{
  "data": [...],
  "total": 1500,
  "page": 1,
  "limit": 10,
  "totalPages": 150,
  "hasNext": true,
  "hasPrev": false
}
```

## Filtering and Search

Many endpoints support filtering:

**Organization Filtering:**
```http
GET /api/organizations?type=company&status=active&name=tech
```

**User Search:**
```http
GET /api/users/search?q=john&organizationId=uuid
```

**Policy Filtering:**
```http
GET /api/policies?resource=organization:*&effect=allow
```

## Real-time Updates

WebSocket connections available at `/events` namespace:

```javascript
const socket = io('ws://localhost:3000/events', {
  auth: {
    token: accessToken
  }
});

// Listen for organization updates
socket.on('organization.updated', (data) => {
  console.log('Organization updated:', data);
});

// Listen for user events
socket.on('user.added_to_organization', (data) => {
  console.log('User added:', data);
});
```

## API Versioning

Current API version: `v1`

Version is included in the URL path:
```
/api/v1/organizations
```

## SDK and Client Libraries

Official SDKs available:
- **JavaScript/TypeScript**: `@saas-template/client-js`
- **Python**: `saas-template-client`
- **Go**: `github.com/saas-template/client-go`

Example usage:
```typescript
import { SaasTemplateClient } from '@saas-template/client-js';

const client = new SaasTemplateClient({
  baseURL: 'https://api.your-domain.com',
  accessToken: 'your-token'
});

const organizations = await client.organizations.list({
  page: 1,
  limit: 10
});
```

## Testing

Use the provided Postman collection and environment files:
- `postman/SAAS-Template-API.postman_collection.json`
- `postman/Development.postman_environment.json`

## Support

For API support:
- **Documentation**: Available at `/api/docs`
- **GitHub Issues**: Repository issue tracker
- **Email**: api-support@your-domain.com