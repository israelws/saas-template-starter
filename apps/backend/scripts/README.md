# Super Admin Management Scripts

These scripts are intended for platform owners only and provide super admin role management capabilities.

## Available Scripts

### 1. Assign Super Admin Role
Grants super admin privileges to an existing user.

```bash
npm run assign-super-admin -- <email>
```

Example:
```bash
npm run assign-super-admin -- admin@example.com
```

### 2. Revoke Super Admin Role
Removes super admin privileges from a user.

```bash
npm run revoke-super-admin -- <email>
```

Example:
```bash
npm run revoke-super-admin -- user@example.com
```

### 3. List All Super Admins
Displays all users with super admin privileges.

```bash
npm run list-super-admins
```

## Super Admin Capabilities

Users with super admin role have full access to:

- **Organizations**: Create, update, and delete any organization
- **Users**: Create, update, and delete any user account
- **Policies**: Create, update, and delete ABAC policies
- **System Settings**: Access to all system configuration
- **Audit Logs**: View all system activity

## Important Notes

1. **Email Verification**: Users must have verified email addresses before being assigned super admin role
2. **Active Status**: Only active users can exercise super admin privileges
3. **Session Refresh**: Users need to log out and log back in after role changes
4. **Audit Trail**: All super admin assignments are logged in user metadata

## Security Considerations

- Keep these scripts secure and limit access to trusted platform administrators
- Regularly audit super admin assignments using the list command
- Consider implementing additional authentication for script execution in production
- Monitor super admin activities through audit logs

## Metadata Structure

Super admin information is stored in the user's metadata field:

```json
{
  "isSuperAdmin": true,
  "superAdminAssignedAt": "2024-01-01T00:00:00.000Z",
  "superAdminAssignedBy": "system-script"
}
```