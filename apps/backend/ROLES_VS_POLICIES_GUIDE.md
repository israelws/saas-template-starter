# Roles vs Policies: Clear Separation of Concerns

## Overview

This guide clarifies the distinction between **Roles** and **Policies** in the SAAS template to avoid confusion and ensure proper permission management.

## Key Concepts

### Roles
- **What**: A named position or job function (e.g., "Manager", "Auditor", "Department Head")
- **Purpose**: Group users by their job function or responsibility
- **Scope**: Defines WHO the user is within the organization
- **Examples**: admin, manager, customer_service, auditor

### Policies
- **What**: Rules that grant or deny access to resources
- **Purpose**: Define specific permissions based on attributes and conditions
- **Scope**: Defines WHAT actions can be performed on WHICH resources under WHAT conditions
- **Examples**: "Managers can edit products in their organization", "Auditors can read all data but not modify"

## How They Work Together

```
User → Has Role(s) → Policies Apply to Roles → Permissions Granted
```

### Example Flow:
1. **User**: John Smith
2. **Role**: Manager
3. **Applicable Policies**:
   - "Manager Product Access" - Can manage products in their organization
   - "Manager Customer Access" - Can view and edit customers
4. **Result**: John can edit products and customers in his organization only

## Clear Separation

### 1. Role Management (/dashboard/roles)
**Purpose**: Define job functions and organize users

**What you do here**:
- Create roles like "Regional Manager", "Support Agent", "Finance Officer"
- Set role descriptions
- Manage role status (active/inactive)
- **DO NOT**: Define what the role can access (that's for policies)

**Role Definition Example**:
```json
{
  "name": "regional_manager",
  "displayName": "Regional Manager",
  "description": "Manages operations for a specific region",
  "isActive": true
}
```

### 2. Policy Management (/dashboard/policies)
**Purpose**: Define access rules and permissions

**What you do here**:
- Create policies that apply to roles
- Define resource access (products, customers, orders)
- Set conditions (organization scope, time restrictions)
- Add resource attributes for fine-grained control

**Policy Definition Example**:
```json
{
  "name": "Regional Manager Access",
  "subjects": {
    "roles": ["regional_manager"]  // Links to the role
  },
  "resources": {
    "types": ["product", "customer", "order"],
    "attributes": {
      "organizationId": "${subject.organizationId}",
      "region": "${subject.region}"
    }
  },
  "actions": ["create", "read", "update", "list"],
  "effect": "allow"
}
```

## Best Practices

### 1. Keep Roles Simple
- Roles should represent job functions, not permissions
- Name roles based on what the person does, not what they can access
- ✅ Good: "customer_service_agent", "department_head"
- ❌ Bad: "can_edit_products", "read_only_user"

### 2. Use Policies for Permissions
- All access control logic goes in policies
- Policies reference roles in their subjects
- One role can have multiple policies
- Policies can be shared across roles

### 3. Avoid Overlap
- **Roles** answer: "What is this person's job?"
- **Policies** answer: "What can someone with this job do?"

### 4. Organization Scoping
- Always use resource attributes in policies for organization scoping
- Example: `"organizationId": "${subject.organizationId}"`
- This ensures users only access their organization's data

## Common Patterns

### 1. Hierarchical Access
```
Role: department_head
Policies:
  - "Department Head Management" - Full access within department
  - "Department Head Reporting" - Read access to company-wide reports
```

### 2. Specialized Functions
```
Role: compliance_officer
Policies:
  - "Compliance Audit Access" - Read all data for compliance
  - "Compliance Report Generation" - Create compliance reports
  - "No Delete Policy" - Explicitly deny deletion of any records
```

### 3. Temporary Access
```
Role: contractor
Policies:
  - "Contractor Limited Access" - Access specific resources
  - "Time-Bound Access" - Only during business hours
  - "Project Scoped" - Only resources tagged with their project
```

## UI Guidelines

### Role Editor (/dashboard/roles)
- **Focus**: Job titles and functions
- **Remove**: Permission checkboxes (these belong in policies)
- **Keep**: Name, display name, description, active status

### Policy Editor (/dashboard/policies)
- **Focus**: Access rules and conditions
- **Keep**: Resource types, actions, conditions, attributes
- **Add**: Clear role selection in subjects

## Migration Path

To clean up the current implementation:

1. **Remove** permission management from Role editor
2. **Keep** roles as simple identifiers
3. **Move** all permission logic to policies
4. **Ensure** policies reference roles correctly
5. **Test** that permissions work through the policy system

## Summary

- **Roles** = WHO (identity/job function)
- **Policies** = WHAT + WHERE + WHEN (permissions)
- Keep them separate for clarity and maintainability
- Use policies to grant permissions to roles, not the other way around