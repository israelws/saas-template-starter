# SAAS Platform User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Organization Management](#organization-management)
4. [User Management](#user-management)
5. [Roles Management](#roles-management)
6. [Policy Management](#policy-management)
7. [Attributes Management](#attributes-management)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## 1. Introduction

Welcome to the SAAS Platform User Manual. This comprehensive guide will help you understand and effectively use the platform's advanced permission management system based on Attribute-Based Access Control (ABAC).

### Key Concepts

- **Organizations**: Hierarchical structures representing companies, divisions, departments, and teams
- **Users**: Individual accounts that can belong to multiple organizations
- **Roles**: Job functions or positions (e.g., Manager, Auditor)
- **Policies**: Rules that define what actions users can perform
- **Attributes**: Dynamic properties used in policy evaluation

---

## 2. Getting Started

### First Login

1. Navigate to the platform login page
2. Enter your credentials
3. Upon first login, you'll be directed to the dashboard
4. Select your active organization from the top navigation

### Dashboard Overview

The main dashboard provides:
- Organization selector (top right)
- Navigation sidebar with key sections
- Quick stats and recent activities
- Action buttons for common tasks

---

## 3. Organization Management

### Understanding Organization Hierarchy

Organizations follow a strict hierarchical structure:

```
Company
├── Division
│   ├── Department
│   │   └── Team
├── Insurance Agency
│   └── Insurance Branch
```

### Creating Organizations

#### Example 1: Creating a Company

1. Navigate to **Dashboard > Organizations**
2. Click **"Create Organization"**
3. Fill in the form:
   - **Name**: "Acme Corporation"
   - **Type**: Company
   - **Parent**: (leave empty for root companies)
   - **Description**: "Main corporate entity"
4. Click **"Create"**

#### Example 2: Creating a Division

1. From the organizations page, click **"Create Organization"**
2. Fill in:
   - **Name**: "North America Operations"
   - **Type**: Division
   - **Parent**: Select "Acme Corporation" (must be a Company)
   - **Description**: "NA regional operations"
3. Click **"Create"**

#### Example 3: Creating a Department

1. Create new organization
2. Fill in:
   - **Name**: "Sales Department"
   - **Type**: Department
   - **Parent**: Select "North America Operations" (must be a Division)
   - **Description**: "Sales team for NA region"

### Managing Organizations

#### Viewing Organization Hierarchy

1. Go to **Dashboard > Organizations**
2. Use the tree view to see the hierarchical structure
3. Click on any organization to view details
4. Use the expand/collapse buttons to navigate

#### Editing Organizations

1. Click on an organization in the tree
2. Select **"Edit"** from the actions menu
3. Update information (Note: organization type cannot be changed)
4. Save changes

#### Organization Constraints

- **Companies** can only have Divisions or Insurance Agencies as children
- **Divisions** can only have Departments as children
- **Departments** can only have Teams as children
- **Teams** cannot have child organizations
- **Insurance Agencies** can only have Insurance Branches as children

---

## 4. User Management

### Creating Users

#### Example 1: Creating a Manager User

1. Navigate to **Dashboard > Users**
2. Click **"Create User"**
3. Fill in:
   - **Email**: manager@acme.com
   - **First Name**: John
   - **Last Name**: Smith
   - **Organizations**: Select "Sales Department"
   - **Roles**: Select "Manager"
4. Click **"Create"**

#### Example 2: Creating a Multi-Organization User

1. Create new user
2. Fill in basic information
3. In Organizations section:
   - Add "North America Operations" with role "Manager"
   - Add "Europe Operations" with role "Auditor"
4. This user can switch between organizations

### Managing User Memberships

#### Adding Organization Membership

1. Go to user details page
2. Click **"Add Organization"**
3. Select organization and role
4. Save changes

#### Removing Organization Membership

1. Go to user details page
2. Find the organization membership
3. Click remove icon
4. Confirm removal

### User Status Management

- **Active**: User can log in and access resources
- **Inactive**: User cannot log in
- **Suspended**: Temporary restriction, can be reactivated

---

## 5. Roles Management

### Understanding Roles

Roles define job functions, NOT permissions. Examples:
- **Admin**: Organization administrator
- **Manager**: Department or team manager
- **Auditor**: Read-only access for compliance
- **User**: Standard user

### Creating Custom Roles

#### Example: Creating a Regional Manager Role

1. Navigate to **Dashboard > Roles**
2. Click **"Create Role"**
3. Fill in:
   - **Role Name**: regional_manager (lowercase, underscores)
   - **Display Name**: Regional Manager
   - **Description**: "Manages multiple departments in a region"
   - **Status**: Active
4. Click **"Create"**

### Important Notes on Roles

- Roles do NOT have permissions attached
- Permissions are granted through policies
- System roles (Admin, Manager, User) cannot be edited
- Custom roles can be created for specific needs

---

## 6. Policy Management

### Understanding Policies

Policies define WHO can do WHAT on WHICH resources under WHAT conditions.

### Policy Components

1. **Subjects**: Who the policy applies to (roles, users, groups)
2. **Resources**: What resources can be accessed
3. **Actions**: What operations are allowed
4. **Conditions**: When the policy applies
5. **Resource Attributes**: Scope resources by attributes

### Creating Policies

#### Example 1: Department Manager Policy

This policy allows managers to manage all resources within their department.

1. Navigate to **Dashboard > Policies**
2. Click **"Create Policy"**
3. Configure:

**Basic Information:**
- Name: "Department Manager Access"
- Description: "Full access to department resources"
- Scope: Organization
- Effect: Allow

**Subjects:**
- Roles: ["manager"]

**Resources:**
- Types: ["product", "customer", "order"]
- Attributes:
  - organizationId: ${subject.organizationId}

**Actions:**
- Select all: create, read, update, delete, list

**Save the policy**

#### Example 2: Auditor Read-Only Policy

1. Create new policy
2. Configure:

**Basic Information:**
- Name: "Auditor Read Access"
- Description: "Read-only access for audit purposes"
- Scope: Organization
- Effect: Allow

**Subjects:**
- Roles: ["auditor"]

**Resources:**
- Types: ["*"] (all resource types)
- Attributes:
  - organizationId: ${subject.organizationId}

**Actions:**
- Select: read, list

**Conditions:**
- Add condition: subject.role === 'auditor'

#### Example 3: Time-Based Access Policy

1. Create policy for contractors with time restrictions:

**Basic Information:**
- Name: "Contractor Business Hours Access"
- Scope: Organization
- Effect: Allow

**Subjects:**
- Roles: ["contractor"]

**Resources:**
- Types: ["project", "document"]
- Attributes:
  - projectId: ${subject.projectId}

**Actions:**
- read, update

**Conditions:**
- Add: environment.timeOfDay >= '09:00'
- Add: environment.timeOfDay <= '17:00'
- Add: environment.dayOfWeek !== 'Sunday'
- Add: environment.dayOfWeek !== 'Saturday'

### Advanced Policy Features

#### Resource-Specific Actions

You can now define different actions for different resource types within a single policy:

1. Click "Add Resource" in the Policy Rules tab
2. Select a resource type (e.g., "User")
3. Check specific actions for that resource (e.g., "read", "update")
4. Add another resource with different actions (e.g., "Product" with "create", "read", "update", "delete")

This allows fine-grained control where a single policy can grant different permissions for different resources.

#### Field-Level Permissions

Control access to specific fields within resources:

1. Enable "Field-level permissions" in the Field Permissions tab
2. Select a resource type
3. For each permission type (Readable/Writable/Denied):
   - Click "Select fields" dropdown
   - Choose specific fields from categorized lists
   - Selected fields appear as badges below
   - Click "Add Selected" to apply

**Field Permission Rules:**
- **Readable**: Only these fields will be returned in API responses
- **Writable**: Only these fields can be modified in updates
- **Denied**: These fields are completely blocked (overrides other permissions)
- Use "*" to allow all fields except those explicitly denied

#### Using Dynamic Variables

Dynamic variables allow policies to adapt to user context:

- `${subject.organizationId}` - User's current organization
- `${subject.departmentId}` - User's department
- `${subject.userId}` - User's ID
- `${environment.ipAddress}` - Request IP
- `${environment.timestamp}` - Current time

#### Resource Attributes

Control which specific resources a policy affects:

```javascript
// Only resources in user's organization
organizationId: "${subject.organizationId}"

// Only resources in specific status
status: "active"

// Only resources created by the user
createdBy: "${subject.userId}"
```

#### Complex Conditions

Combine multiple conditions for fine-grained control:

```javascript
// Manager can approve orders under $10,000
subject.role === 'manager' && resource.amount < 10000

// Access only during office hours
environment.timeOfDay >= '09:00' && environment.timeOfDay <= '18:00'

// Region-specific access
subject.region === resource.region
```

---

## 7. Attributes Management

### Understanding Attributes

Attributes are dynamic properties that can be attached to:
- **Subjects** (users): role, department, clearanceLevel
- **Resources** (objects): status, owner, classification
- **Environment** (context): time, location, deviceType

### Creating Attributes

#### Example 1: Creating a Clearance Level Attribute

1. Navigate to **Dashboard > Attributes**
2. Click **"Create Attribute"**
3. Configure:
   - **Name**: clearanceLevel
   - **Category**: subject
   - **Type**: string
   - **Possible Values**: ["public", "internal", "confidential", "secret"]
   - **Description**: "Security clearance level"
4. Save

#### Example 2: Creating a Resource Classification

1. Create new attribute
2. Configure:
   - **Name**: classification
   - **Category**: resource
   - **Type**: string
   - **Possible Values**: ["public", "internal", "restricted"]

### Using Attributes in Policies

Once created, attributes can be used in policy conditions:

```javascript
// Only users with proper clearance
subject.clearanceLevel === 'secret' || subject.clearanceLevel === 'confidential'

// Match clearance to classification
subject.clearanceLevel >= resource.classification
```

---

## 8. Best Practices

### Organization Structure

1. **Keep it Simple**: Don't create unnecessary hierarchy levels
2. **Logical Grouping**: Group by function, not just geography
3. **Consistent Naming**: Use clear, descriptive names

### Role Design

1. **Job-Based**: Name roles after job functions
2. **Avoid Permission Names**: Don't use "can_edit_products"
3. **Reusable**: Design roles that work across organizations

### Policy Design

1. **Principle of Least Privilege**: Grant minimum necessary access
2. **Use Resource Attributes**: Scope policies to organization
3. **Test Thoroughly**: Use policy tester before deployment
4. **Document Purpose**: Clear descriptions help maintenance

### Security Best Practices

1. **Regular Audits**: Review policies and access quarterly
2. **Remove Stale Access**: Deactivate unused accounts
3. **Monitor Changes**: Track policy modifications
4. **Separation of Duties**: Split sensitive operations

---

## 9. Troubleshooting

### Common Issues

#### "Access Denied" Errors

1. Check user's active organization
2. Verify user has appropriate role
3. Check if relevant policies exist
4. Test policy with policy tester
5. Verify resource attributes match

#### Policy Not Working

1. Ensure policy is active
2. Check policy scope (System vs Organization)
3. Verify subject matches (role/user/group)
4. Test conditions with actual values
5. Check resource attributes

#### Organization Hierarchy Issues

1. Verify parent-child relationships
2. Check organization types match constraints
3. Ensure no circular references
4. Validate all required fields

### Getting Help

1. Check audit logs for details
2. Use policy tester for debugging
3. Contact support with:
   - User ID
   - Organization ID
   - Time of issue
   - Error messages

---

## Appendix A: Policy Examples Library

### Financial Approval Hierarchy

```javascript
// Junior staff: up to $1,000
{
  subjects: { roles: ["staff"] },
  resources: { types: ["purchase_order"] },
  actions: ["create", "read"],
  conditions: ["resource.amount <= 1000"]
}

// Managers: up to $10,000
{
  subjects: { roles: ["manager"] },
  resources: { types: ["purchase_order"] },
  actions: ["create", "read", "approve"],
  conditions: ["resource.amount <= 10000"]
}

// Directors: up to $100,000
{
  subjects: { roles: ["director"] },
  resources: { types: ["purchase_order"] },
  actions: ["create", "read", "approve"],
  conditions: ["resource.amount <= 100000"]
}
```

### Department Isolation

```javascript
// Users can only see their department's data
{
  subjects: { roles: ["user"] },
  resources: { 
    types: ["*"],
    attributes: {
      departmentId: "${subject.departmentId}"
    }
  },
  actions: ["read", "list"]
}
```

### Cross-Department Collaboration

```javascript
// Project members can access project resources regardless of department
{
  subjects: { groups: ["project_members"] },
  resources: { 
    types: ["project", "task", "document"],
    attributes: {
      projectId: "${subject.projects}"
    }
  },
  actions: ["read", "update", "comment"]
}
```

## 9. Field Access Audit

The Field Access Audit feature provides comprehensive monitoring of field-level access attempts across your organization.

### Accessing the Audit Log

1. Navigate to **Dashboard** → **Field Access Audit**
2. The audit log displays all field access attempts

### Understanding Audit Entries

Each audit entry shows:
- **Timestamp**: When the access occurred
- **User**: Who attempted the access
- **Action**: Type of access (Read/Write/Denied)
- **Resource**: What was accessed
- **Fields**: Which specific fields were accessed
- **Organization**: Context of the access
- **IP Address**: Source of the request

### Filtering Audit Logs

Use filters to find specific access patterns:
- **Search**: Find by user name or resource ID
- **Resource Type**: Filter by Customer, User, Product, etc.
- **Action**: Show only Read, Write, or Denied attempts
- **Date Range**: Select specific time period

### Security Monitoring

Pay special attention to:
- **Denied Access Attempts**: May indicate unauthorized access attempts
- **Sensitive Field Access**: Monitor access to SSN, credit scores, etc.
- **Unusual Patterns**: Multiple denied attempts or unusual access times

### Exporting Data

1. Apply desired filters
2. Click **Export CSV** to download audit data
3. Use for compliance reporting or further analysis

---

## Appendix B: Quick Reference

### Organization Type Hierarchy
- Company → Division → Department → Team
- Company → Insurance Agency → Insurance Branch

### Role Naming Convention
- Lowercase with underscores: `regional_manager`
- Descriptive display names: "Regional Manager"

### Policy Scope
- **System**: Applies to all organizations
- **Organization**: Applies to specific organization

### Common Dynamic Variables
- `${subject.organizationId}`
- `${subject.userId}`
- `${subject.role}`
- `${environment.timestamp}`
- `${resource.owner}`

---

*Last Updated: January 2024*
*Version: 1.0*