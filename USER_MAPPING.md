# User Mapping and Organization Assignment

## System Administrators
These users have super_admin role and full system access:
- israel+t21@committed.co.il
- israel+t13@committed.co.il  
- israel+t20@committed.co.il

## User Organization Assignments

### Acme Corporation
| User Email | Organization | Role | Policy | Notes |
|------------|--------------|------|---------|-------|
| john.doe@acme.com | Acme Corporation | admin | Organization Admin Policy | Main company admin |
| jane.smith@acme.com | Acme Corporation > North America Division | manager | Department Manager Policy | NA Division manager |
| bob.wilson@acme.com | Acme Corporation > North America Division > Sales Department | user | Basic User Policy | Sales rep |
| alice.brown@acme.com | Acme Corporation > North America Division > Sales Department | manager | Department Manager Policy | Sales manager |
| charlie.davis@acme.com | Acme Corporation > Europe Division | manager | Department Manager Policy | EU Division manager |
| david.miller@acme.com | Acme Corporation > Europe Division > Marketing Department | user | Basic User Policy | Marketing analyst |

### TechStart Inc
| User Email | Organization | Role | Policy | Notes |
|------------|--------------|------|---------|-------|
| emily.jones@techstart.com | TechStart Inc | admin | Organization Admin Policy | Company admin |
| frank.taylor@techstart.com | TechStart Inc > Product Division | manager | Department Manager Policy | Product lead |
| grace.anderson@techstart.com | TechStart Inc > Product Division > Engineering Team | user | Basic User Policy | Engineer |
| henry.thomas@techstart.com | TechStart Inc > Product Division > Design Team | user | Basic User Policy | Designer |

### Global Insurance Group
| User Email | Organization | Role | Policy | Notes |
|------------|--------------|------|---------|-------|
| isabella.martinez@globalins.com | Global Insurance Group | admin | Organization Admin Policy | Insurance admin |
| jack.robinson@globalins.com | Global Insurance Group > State Insurance Agency | manager | Insurance Manager Policy | Agency manager |
| karen.clark@globalins.com | Global Insurance Group > State Insurance Agency > Downtown Branch | user | Insurance Agent Policy | Insurance agent |
| liam.rodriguez@globalins.com | Global Insurance Group > State Insurance Agency > Uptown Branch | user | Insurance Agent Policy | Insurance agent |

### Multi-Organization Users
| User Email | Organizations | Roles | Notes |
|------------|---------------|-------|-------|
| michael.lee@consultant.com | Acme Corporation (auditor), TechStart Inc (auditor) | auditor | External auditor |
| nancy.walker@contractor.com | Acme Corporation > North America Division (user), TechStart Inc > Product Division (user) | user | Shared contractor |

### Unassigned Users
These users need to be assigned to organizations:
| User Email | Suggested Organization | Suggested Role |
|------------|----------------------|----------------|
| oliver.hall@example.com | TBD | user |
| patricia.allen@example.com | TBD | user |
| quincy.young@example.com | TBD | user |

## Role Definitions

### System Roles
- **super_admin**: Full system access, can manage all organizations
- **admin**: Organization administrator with full access within their organization
- **manager**: Can manage products, customers, and orders within their organization
- **user**: Basic user with read access to resources
- **guest**: Limited access for guest users

### Custom Roles
- **auditor**: Read-only access to all resources for audit purposes
- **department_head**: Head of department with approval rights
- **customer_service**: Support team member with customer and order access

## Policy Assignments

### Standard Policies
1. **Organization Admin Policy**: Full access to manage organization resources
2. **Department Manager Policy**: Manage department resources and team members
3. **Basic User Policy**: Read access with limited write permissions
4. **Auditor Policy**: Read-only access across organization
5. **Insurance Manager Policy**: Manage insurance operations and agents
6. **Insurance Agent Policy**: Handle customer policies and claims

### Special Policies
- **Multi-Org Access Policy**: For users with access to multiple organizations
- **Time-Restricted Policy**: For contractors with time-based access
- **Field-Level Permission Policy**: Specific field access controls

## Implementation Notes

1. System administrators (israel+t*) should bypass organization checks
2. Each user should have at least one organization assignment
3. Roles define job functions, policies define actual permissions
4. Multi-organization users need separate role assignments per organization
5. Audit all permission changes through the audit log system