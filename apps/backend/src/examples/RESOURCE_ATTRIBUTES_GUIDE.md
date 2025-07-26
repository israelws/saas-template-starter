# Resource Attributes in ABAC Policies

## Overview

Resource attributes allow you to define fine-grained access control by specifying which resource properties must match for a policy to apply. This feature gives you full flexibility in defining security constraints without hardcoding platform-specific rules.

## Key Features

1. **Dynamic Variable Substitution**: Use variables like `${subject.organizationId}` that are evaluated at runtime
2. **Multiple Attributes**: Define multiple attribute constraints that must ALL match
3. **UI Support**: Full editing capability in the policy editor interface
4. **Flexible Scoping**: Works for organization, department, team, or any custom scoping

## How It Works

When you define resource attributes in a policy:
```json
{
  "resources": {
    "types": ["product", "customer"],
    "attributes": {
      "organizationId": "${subject.organizationId}",
      "status": "active"
    }
  }
}
```

The system will:
1. Replace `${subject.organizationId}` with the actual user's organization ID at runtime
2. Check that the resource has `organizationId` matching the user's organization
3. Check that the resource has `status` equal to "active"
4. Only apply the policy if ALL attribute conditions match

## Available Dynamic Variables

- `${subject.id}` - The current user's ID
- `${subject.organizationId}` - The user's current organization ID
- `${subject.departmentId}` - The user's department ID (if available)
- `${subject.email}` - The user's email address
- Any other subject attribute available in the user context

## Examples

### 1. Organization Scoping
Ensure users can only access resources in their organization:
```json
{
  "attributes": {
    "organizationId": "${subject.organizationId}"
  }
}
```

### 2. Owner-Based Access
Allow users to access only their own resources:
```json
{
  "attributes": {
    "ownerId": "${subject.id}"
  }
}
```

### 3. Department + Status Filtering
Complex constraints with multiple attributes:
```json
{
  "attributes": {
    "organizationId": "${subject.organizationId}",
    "departmentId": "${subject.departmentId}",
    "status": "published",
    "visibility": "department"
  }
}
```

### 4. Static Values
Mix dynamic and static values:
```json
{
  "attributes": {
    "organizationId": "${subject.organizationId}",
    "region": "us-west-2",
    "tier": "premium"
  }
}
```

## Using the Policy Editor

1. Navigate to the policy editor
2. In the "Resource Attributes" section, click "Add Attribute"
3. Enter the attribute key (e.g., `organizationId`)
4. Enter the value (e.g., `${subject.organizationId}` or a static value)
5. Add multiple attributes as needed
6. Save the policy

## Best Practices

1. **Always Include Organization Scoping**: For multi-tenant applications, always include `organizationId` attribute
2. **Use Dynamic Variables**: Prefer `${subject.organizationId}` over hardcoded organization IDs
3. **Document Your Attributes**: Use clear, consistent attribute names across your application
4. **Test Your Policies**: Use the policy tester to verify attribute matching works correctly
5. **Combine with Conditions**: Use attributes for resource properties, conditions for runtime checks

## Migration from Hardcoded Policies

Before (hardcoded):
```json
{
  "organizationId": "fd8f7668-b013-4428-be54-4f35d53c6ee8"
}
```

After (dynamic):
```json
{
  "organizationId": "${subject.organizationId}"
}
```

This makes the policy work for ANY organization, not just a specific one.

## Troubleshooting

1. **Attributes Not Matching**: Check that your resources actually have the specified attributes
2. **Variable Not Replacing**: Ensure the variable name matches exactly (case-sensitive)
3. **Policy Not Applying**: Verify all attributes match - they use AND logic
4. **Performance**: Index frequently queried attributes in your database