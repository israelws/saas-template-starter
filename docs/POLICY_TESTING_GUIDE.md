# Policy System Testing Guide

This guide provides comprehensive instructions for testing the ABAC (Attribute-Based Access Control) policy system, including the new resource attribute conditions feature.

## Overview

The policy system now supports dynamic variable substitution in resource attribute conditions, allowing for sophisticated access control patterns like:
- Organization-scoped access (`${subject.organizationId}`)
- Personal resource ownership (`${subject.id}`)
- Department-level access (`${subject.departmentId}`)
- Healthcare scenarios (therapist-patient relationships)

## Testing Components

### 1. Backend Variable Substitution

The `PolicyEvaluatorService` has been enhanced to support variable substitution:

```typescript
// Example policy with variable substitution
{
  resources: {
    types: ['product'],
    attributes: {
      organizationId: '${subject.organizationId}'
    }
  }
}
```

**Test Files:**
- `apps/backend/src/modules/abac/services/policy-evaluator.service.spec.ts`
- `apps/backend/src/modules/abac/guards/abac.guard.spec.ts`
- `apps/backend/src/modules/abac/controllers/policy.controller.spec.ts`

### 2. Frontend Policy Builder

The policy builder UI includes:
- Resource attribute conditions in the Policy Rules tab
- Automatic synchronization with the Conditions tab
- Intuitive value selectors with semantic options
- Visual preview of conditions in plain English

**Key Components:**
- `EnhancedPolicyBuilderV2` - Main policy builder component
- `AttributeValueSelector` - Smart dropdown for selecting values
- `ConditionPreview` - Shows conditions in plain English

### 3. Test Data

Comprehensive test policies are available in:
- `apps/backend/src/seeds/test-policies.seed.ts`

## Running Tests

### Unit Tests

```bash
# Run all backend tests
npm run test:backend

# Run specific test files
npm run test:backend -- policy-evaluator.service.spec.ts
npm run test:backend -- abac.guard.spec.ts
npm run test:backend -- policy.controller.spec.ts
```

### Integration Tests

1. **Start the backend:**
```bash
npm run dev:backend
```

2. **Run the manual test script:**
```bash
# Set your auth token first
export AUTH_TOKEN="your-jwt-token-here"
export API_URL="http://localhost:3000"

# Run the test script
npm run script test-policies
```

### Manual Testing Checklist

#### 1. Policy Creation with Resource Conditions

1. Navigate to Policies page in admin dashboard
2. Click "New Policy"
3. Fill in basic information:
   - Name: "Test Organization Scoped Access"
   - Effect: Allow
   - Priority: 50

4. In Policy Rules tab:
   - Add Resource: "product"
   - Select Actions: read, list, update
   - Expand "Resource Attribute Conditions"
   - Use quick template: "Own Organization Only"
   - Or manually add:
     - Attribute: `organizationId`
     - Operator: `equals`
     - Value: Select "User's Organization" or type `${subject.organizationId}`

5. Switch to Conditions tab:
   - Verify the resource condition appears with "From Resource" badge
   - Confirm it's read-only (disabled inputs)

6. Save the policy

#### 2. Test Policy Evaluation

Using the API or test script, verify these scenarios:

**✅ Should Allow:**
```json
{
  "subject": {
    "attributes": { "organizationId": "org-123" }
  },
  "resource": {
    "type": "product",
    "attributes": { "organizationId": "org-123" }
  },
  "action": "read"
}
```

**❌ Should Deny:**
```json
{
  "subject": {
    "attributes": { "organizationId": "org-123" }
  },
  "resource": {
    "type": "product",
    "attributes": { "organizationId": "org-456" }
  },
  "action": "read"
}
```

#### 3. Test Various Patterns

1. **Personal Resources:**
   - Attribute: `ownerId`
   - Value: "Current User" or `${subject.id}`

2. **Department Access:**
   - Attribute: `departmentId`
   - Value: "User's Department" or `${subject.departmentId}`

3. **Healthcare - Therapist Patients:**
   - Resource: "patient"
   - Attribute: `patientId`
   - Operator: `in`
   - Value: "Therapist's Patients" or `${subject.patientIds}`

#### 4. Verify Guard Protection

Test that the ABAC guard properly enforces policies:

1. Try to access a product from a different organization
2. Verify you get a 403 Forbidden error
3. Check that the error message includes policy denial reason

## Common Test Scenarios

### 1. Organization Isolation
```typescript
// User from org-A cannot access resources from org-B
const policy = {
  resources: {
    attributes: {
      organizationId: '${subject.organizationId}'
    }
  }
};
```

### 2. Owner-Only Access
```typescript
// Users can only modify their own documents
const policy = {
  resources: {
    attributes: {
      ownerId: '${subject.id}'
    }
  }
};
```

### 3. Department Hierarchy
```typescript
// Access limited to same department
const policy = {
  resources: {
    attributes: {
      departmentId: '${subject.departmentId}'
    }
  }
};
```

### 4. Array Membership
```typescript
// Therapist can access assigned patients
const policy = {
  resources: {
    attributes: {
      patientId: { $in: '${subject.patientIds}' }
    }
  }
};
```

## Troubleshooting

### Policy Not Working

1. **Check variable syntax:** Ensure variables use correct format: `${subject.attribute}`
2. **Verify attributes exist:** Check that both subject and resource have required attributes
3. **Review policy priority:** Lower numbers = higher priority
4. **Check policy is active:** Ensure `isActive: true`

### Variable Not Resolving

1. **Check ABAC guard:** Verify subject attributes are populated in `abac.guard.ts`
2. **Debug evaluation:** Add logging in `PolicyEvaluatorService.resolveVariables()`
3. **Test with hardcoded values:** Replace variables with actual values to isolate issue

### Frontend Issues

1. **Conditions not syncing:** Check browser console for errors
2. **Values not saving:** Verify backend is storing `metadata.resourceRules`
3. **UI not updating:** Try refreshing the page after save

## Performance Testing

Monitor policy evaluation performance:

```typescript
// Expected: < 100ms for policy evaluation
const start = Date.now();
const result = await policyEvaluator.evaluate(context);
console.log(`Evaluation time: ${Date.now() - start}ms`);
```

## Security Considerations

1. **Variable injection:** System prevents user input in variable paths
2. **SQL injection:** Variable values are parameterized
3. **Cross-org access:** Deny policies take precedence
4. **Cache poisoning:** Cache keys include all context parameters

## Next Steps

1. Add more comprehensive E2E tests
2. Implement policy simulation/testing UI
3. Add policy version history
4. Create policy templates library
5. Add real-time policy evaluation monitoring