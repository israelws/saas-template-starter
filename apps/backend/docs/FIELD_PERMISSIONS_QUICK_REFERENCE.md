# Field Permissions & Multi-Role Quick Reference

## 🚀 Quick Setup

### 1. Controller Setup
```typescript
@Controller('resource')
@UseGuards(JwtAuthGuard, CaslAbacGuard)         // ✅ Use CaslAbacGuard
@UseInterceptors(FieldAccessInterceptor)        // ✅ Add field filtering
export class ResourceController {
  constructor(private fieldFilterService: FieldFilterService) {}
}
```

### 2. Endpoint Configuration
```typescript
// Read with field filtering
@Get(':id')
@RequirePermission('resource', 'read')          // Legacy - still works
@UseFieldFiltering('Resource')                   // ✅ Add for field filtering
findOne(@Param('id') id: string) {
  return this.service.findOne(id);
}

// Write with field filtering
@Post()
@CheckAbility({ action: 'create', subject: 'Resource' })  // New decorator
async create(@Body() dto: CreateDto, @Request() req) {
  const filtered = await this.fieldFilterService.filterFieldsForWrite(
    req.user, req.organizationId, 'Resource', dto
  );
  return this.service.create(filtered);
}
```

## 📋 Policy Field Permissions

```typescript
{
  fieldPermissions: {
    Customer: {
      readable: ['id', 'name', 'email'],     // Only these fields returned
      writable: ['email', 'phone'],          // Only these can be updated
      denied: ['ssn', 'creditScore']         // Never accessible
    }
  }
}
```

### Rules:
- ✅ `denied` overrides everything
- ✅ If `readable` specified → ONLY those fields returned
- ✅ If `readable` NOT specified → ALL fields except `denied`
- ✅ Empty `writable` = can't write any fields

## 👥 Multi-Role Management

### Assign Roles
```typescript
// Primary role
await userService.assignRole(userId, orgId, 'agent', adminId, {
  priority: 100
});

// Temporary elevated role
await userService.assignRole(userId, orgId, 'manager', adminId, {
  priority: 200,                        // Higher = evaluated first
  validTo: new Date('2025-12-31')     // Expires
});
```

### Check Roles
```typescript
// Get all active roles (sorted by priority)
const roles = await userService.getUserRoles(userId, orgId);

// Check specific role
const isManager = await userService.hasRole(userId, orgId, 'manager');

// Get primary (highest priority) role
const primary = await userService.getUserHighestPriorityRole(userId, orgId);
```

## 🔍 Common Patterns

### 1. Public vs Private Fields
```typescript
// Customer sees limited fields
Customer: {
  readable: ['id', 'name', 'email', 'publicProfile'],
  denied: ['internalNotes', 'riskScore', 'profit']
}

// Staff sees more
Staff: {
  readable: ['*'],           // All fields
  denied: ['ssn', 'password'] // Except these
}
```

### 2. Role-Based Field Access
```typescript
// Sales: See prices, not costs
Sales: {
  readable: ['id', 'name', 'price', 'description'],
  denied: ['cost', 'margin', 'supplier']
}

// Manager: See everything except sensitive
Manager: {
  readable: ['*'],
  denied: ['password', 'securityQuestions']
}
```

### 3. Write Restrictions
```typescript
// Users can only update their profile
User: {
  readable: ['*'],
  writable: ['name', 'email', 'phone', 'address'],
  denied: ['id', 'createdAt', 'role', 'permissions']
}
```

## 🐛 Troubleshooting

| Issue | Check | Solution |
|-------|-------|----------|
| Fields not filtered | `@UseFieldFiltering` present? | Add decorator to endpoint |
| Empty responses | Policy too restrictive? | Check `readable` list |
| Can't update fields | `writable` defined? | Add fields to `writable` |
| Wrong permissions | Multiple roles? | Check role priorities |

## 📝 Examples

### Insurance Agent
```typescript
{
  roles: ['agent'],
  fieldPermissions: {
    Customer: {
      readable: ['name', 'email', 'policyNumber'],
      denied: ['ssn', 'medicalHistory', 'income']
    },
    Policy: {
      readable: ['*'],
      denied: ['profitMargin', 'internalNotes']
    }
  }
}
```

### Customer Self-Service
```typescript
{
  roles: ['customer'],
  resources: { 
    attributes: { customerId: '${subject.id}' }  // Own data only
  },
  fieldPermissions: {
    Profile: {
      readable: ['*'],
      writable: ['email', 'phone', 'address'],
      denied: ['customerId', 'internalRating']
    }
  }
}
```

### Auditor (Read-Only)
```typescript
{
  roles: ['auditor'],
  actions: ['read', 'export'],
  fieldPermissions: {
    '*': {
      readable: ['*'],   // Read everything
      writable: []       // Write nothing
    }
  }
}
```

## 🔧 Testing

```typescript
// Check field permissions
const result = await caslAbilityFactory.canWithFields(
  user, 'read', resource, orgId
);
console.log(result);
// { 
//   allowed: true,
//   readableFields: ['id', 'name'],
//   deniedFields: ['ssn']
// }

// Integration test
expect(response.body).toHaveProperty('name');
expect(response.body).not.toHaveProperty('ssn');
```

## 💡 Best Practices

1. **Start Restrictive**: Better to add permissions than remove
2. **Use Explicit Denials**: For sensitive fields like SSN, passwords
3. **Document Fields**: Keep a list of sensitive fields per resource
4. **Test Combinations**: Verify multi-role scenarios
5. **Audit Access**: Log access to sensitive fields

## 🔗 Related Documentation

- [Full Field Permissions Guide](./FIELD_PERMISSIONS_GUIDE.md)
- [ABAC Policy Reference](./ABAC_REFERENCE.md)
- [Migration Guide](./MIGRATION_GUIDE.md)