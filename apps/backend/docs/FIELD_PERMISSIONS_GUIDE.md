# Field-Level Permissions & Multi-Role Support Guide

## Overview

This guide documents the enhanced ABAC (Attribute-Based Access Control) system that now supports field-level permissions and multi-role assignments. These features enable fine-grained control over what data users can see and modify, perfect for complex enterprise scenarios like insurance agencies, healthcare systems, or financial institutions.

## Table of Contents

1. [Field-Level Permissions](#field-level-permissions)
2. [Multi-Role Support](#multi-role-support)
3. [Migration Guide](#migration-guide)
4. [API Usage](#api-usage)
5. [Policy Examples](#policy-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Field-Level Permissions

### What are Field-Level Permissions?

Field-level permissions allow you to control access to specific fields within a resource. For example:
- An insurance agent can see a customer's name and policy number but not their SSN or medical history
- A sales representative can see product prices but not cost or profit margins
- A customer can update their email and phone but not their internal credit rating

### How It Works

The system uses [CASL](https://casl.js.org/) integrated with our existing ABAC system to provide field filtering at two levels:

1. **Response Filtering**: Automatically removes fields from API responses based on permissions
2. **Input Validation**: Strips unauthorized fields from update/create requests

### Configuration

Field permissions are configured in policies using the `fieldPermissions` property:

```typescript
{
  name: 'Agent Limited Access',
  effect: 'Allow',
  subjects: { roles: ['agent'] },
  resources: { types: ['Customer'] },
  actions: ['read'],
  fieldPermissions: {
    Customer: {
      readable: ['id', 'name', 'email', 'phone'],  // Explicitly allowed fields
      writable: ['notes'],                          // Fields they can modify
      denied: ['ssn', 'creditScore', 'income']     // Explicitly denied fields
    }
  }
}
```

### Field Permission Types

1. **readable**: Fields the user can view in responses
2. **writable**: Fields the user can include in create/update requests
3. **denied**: Fields explicitly blocked (takes precedence over readable/writable)

If `readable` is specified, ONLY those fields are returned. If not specified, all fields except `denied` are returned.

## Multi-Role Support

### Overview

Users can now have multiple roles within the same organization, each with different priorities and validity periods. This enables:

- Temporary role assignments (e.g., acting manager)
- Role combinations (e.g., agent who is also a trainer)
- Time-bound permissions (e.g., contractor access)

### Database Schema

```sql
-- New user_roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  role_name VARCHAR(100),
  priority INTEGER DEFAULT 0,        -- Higher values take precedence
  assigned_by UUID,
  assigned_at TIMESTAMP,
  valid_from TIMESTAMP,
  valid_to TIMESTAMP,               -- NULL means permanent
  is_active BOOLEAN DEFAULT true
);
```

### Role Priority

When a user has multiple roles, the system evaluates permissions in priority order:
- Higher priority roles are checked first
- First "Allow" or "Deny" decision wins
- If no decision is made, move to next role

### API Usage

#### Assigning Multiple Roles

```typescript
// Assign primary role
await userService.assignRole(
  userId,
  organizationId,
  'agent',
  assignedByUserId,
  { priority: 100 }
);

// Assign temporary elevated role
await userService.assignRole(
  userId,
  organizationId,
  'branch_manager',
  assignedByUserId,
  {
    priority: 200,                    // Higher priority
    validFrom: new Date(),
    validTo: new Date('2025-12-31')  // Expires end of year
  }
);
```

#### Checking User Roles

```typescript
// Get all active roles
const roles = await userService.getUserRoles(userId, organizationId);

// Check specific role
const hasManagerRole = await userService.hasRole(userId, organizationId, 'manager');

// Get highest priority role
const primaryRole = await userService.getUserHighestPriorityRole(userId, organizationId);
```

## Migration Guide

### From Existing RBAC to Enhanced ABAC

1. **Keep existing decorators**: Your current `@RequirePermission` decorators continue to work
2. **Add field filtering**: Enhance endpoints with `@UseFieldFiltering` decorator
3. **Update guards**: Replace `AbacGuard` with `CaslAbacGuard` for field support

#### Before:
```typescript
@Get(':id')
@RequirePermission('product', 'read')
findOne(@Param('id') id: string) {
  return this.productsService.findOne(id);
}
```

#### After:
```typescript
@Get(':id')
@RequirePermission('product', 'read')
@UseFieldFiltering('Product')  // Add this for field filtering
findOne(@Param('id') id: string) {
  return this.productsService.findOne(id);
}
```

### Database Migration

Run the provided migration to add multi-role support:

```bash
npm run migration:run
```

This adds:
- `user_roles` table for multi-role assignments
- `field_permissions` column to policies table
- `policy_field_rules` table for granular field control
- Validity period columns to user attributes

## API Usage

### Controller Setup

```typescript
@Controller('products')
@UseGuards(JwtAuthGuard, CaslAbacGuard)        // Use CaslAbacGuard
@UseInterceptors(FieldAccessInterceptor)       // Add field filtering
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private fieldFilterService: FieldFilterService,  // Inject for write filtering
  ) {}

  @Post()
  @CheckAbility({ action: 'create', subject: 'Product' })
  async create(@Body() createDto: CreateProductDto, @Request() req) {
    // Filter out fields user can't write
    const filtered = await this.fieldFilterService.filterFieldsForWrite(
      req.user,
      req.organizationId,
      'Product',
      createDto
    );
    
    return this.productsService.create(filtered);
  }

  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'Product' })
  @UseFieldFiltering('Product')  // Response will be auto-filtered
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
```

### Checking Field Permissions

```typescript
// Check what fields a user can access
const fieldCheck = await caslAbilityFactory.canWithFields(
  user,
  'read',
  product,
  organizationId
);

console.log(fieldCheck);
// {
//   allowed: true,
//   readableFields: ['id', 'name', 'price'],
//   writableFields: ['name'],
//   deniedFields: ['costPrice', 'profitMargin']
// }
```

### Field Permissions Endpoint

Each resource can expose its field permissions:

```typescript
@Get(':id/field-permissions')
async getFieldPermissions(@Param('id') id: string, @Request() req) {
  const ability = req.caslAbility;
  const fieldPerms = ability.fieldPermissions.get('Product');
  
  return {
    resourceType: 'Product',
    resourceId: id,
    permissions: fieldPerms,
    canDelete: ability.can('delete', product),
  };
}
```

## Policy Examples

### Insurance Agent Policy
```typescript
{
  name: 'Insurance Agent - Customer Data Access',
  subjects: { roles: ['agent'] },
  resources: { types: ['Customer', 'Policy'] },
  actions: ['read', 'create', 'update'],
  fieldPermissions: {
    Customer: {
      readable: ['id', 'name', 'email', 'phone', 'address'],
      writable: ['phone', 'email', 'address'],
      denied: ['ssn', 'dateOfBirth', 'medicalHistory', 'creditScore']
    },
    Policy: {
      readable: ['*'],  // All fields except denied
      denied: ['internalNotes', 'profitMargin', 'agentCommission']
    }
  }
}
```

### Customer Self-Service Policy
```typescript
{
  name: 'Customer Portal Access',
  subjects: { roles: ['customer'] },
  resources: { 
    types: ['Customer', 'Policy'],
    attributes: { customerId: '${subject.id}' }  // Only their own data
  },
  actions: ['read', 'update'],
  conditions: {
    mfa: { required: true },
    session: { maxDuration: 1800 }
  },
  fieldPermissions: {
    Customer: {
      readable: ['*'],
      writable: ['email', 'phone', 'mailingAddress'],
      denied: ['internalNotes', 'riskScore', 'customerId']
    }
  }
}
```

### Auditor Read-Only Policy
```typescript
{
  name: 'Auditor Full Read Access',
  subjects: { roles: ['auditor'] },
  resources: { types: ['*'] },
  actions: ['read', 'export'],
  fieldPermissions: {
    '*': {
      readable: ['*'],    // Can read everything
      writable: [],       // Can't write anything
    }
  }
}
```

## Best Practices

### 1. Policy Design

- **Start Restrictive**: Begin with minimal permissions and add as needed
- **Use Explicit Denials**: For sensitive fields, use explicit `denied` lists
- **Group Related Fields**: Create logical groupings in your permissions
- **Document Fields**: Maintain a data dictionary of sensitive fields

### 2. Performance Optimization

- **Cache Policies**: Policy evaluation results are cached automatically
- **Minimize Field Lists**: Use wildcards when possible instead of listing every field
- **Index Role Lookups**: Ensure database indexes on user_roles table

### 3. Security Considerations

- **Audit Sensitive Access**: Log access to fields marked as sensitive
- **Regular Reviews**: Periodically review field permissions
- **Test Thoroughly**: Use integration tests to verify field filtering
- **Default Deny**: For undefined fields, default to denying access

### 4. Multi-Role Management

- **Clear Priority Scheme**: Document your role priority hierarchy
- **Time-Bound Roles**: Use validity periods for temporary access
- **Role Combinations**: Test how multiple roles interact
- **Audit Trail**: Track who assigned roles and when

## Troubleshooting

### Common Issues

#### 1. Fields Not Being Filtered

**Problem**: Sensitive fields still appearing in responses

**Solutions**:
- Ensure `@UseFieldFiltering` decorator is applied
- Check that `FieldAccessInterceptor` is registered
- Verify policy has `fieldPermissions` defined
- Check policy is active and applies to user's role

#### 2. All Fields Being Removed

**Problem**: Response is empty or missing expected fields

**Solutions**:
- Check if `readable` list is too restrictive
- Verify user has the expected role
- Check policy priority (lower priority = evaluated first)
- Look for conflicting deny policies

#### 3. Multi-Role Conflicts

**Problem**: User permissions not as expected with multiple roles

**Solutions**:
- Check role priorities (higher = evaluated first)
- Verify role validity periods
- Use `getUserRoles()` to see active roles
- Check for deny policies that might override allows

### Debug Mode

Enable debug logging for field permissions:

```typescript
// In your service
const ability = await this.caslAbilityFactory.createForUser(user, orgId);
console.log('Field Permissions:', ability.fieldPermissions);
console.log('Can read product:', ability.can('read', product));
```

### Testing Field Permissions

```typescript
// Integration test example
it('should filter sensitive fields for agent', async () => {
  const response = await request(app.getHttpServer())
    .get('/customers/123')
    .set('Authorization', `Bearer ${agentToken}`)
    .expect(200);
    
  expect(response.body).toHaveProperty('name');
  expect(response.body).not.toHaveProperty('ssn');
  expect(response.body).not.toHaveProperty('creditScore');
});
```

## Conclusion

The enhanced ABAC system with field-level permissions and multi-role support provides the flexibility needed for complex authorization scenarios. By following this guide and best practices, you can implement fine-grained access control that meets regulatory requirements while maintaining good performance and user experience.