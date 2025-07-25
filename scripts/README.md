# Scripts Directory

This directory contains utility scripts for development, testing, and deployment.

## Organization Scripts
- `populate-organizations.js` - Node.js script to populate organization hierarchy via API
- `reset-and-populate-organizations.js` - Browser script to reset and repopulate organizations
- `create-org-hierarchy.js` - Create organization hierarchy test data
- `diagnose-tree.js` - Diagnose organization tree structure issues
- `debug-organizations.js` - Debug organization data structure

## Test Scripts
- `test-jwt.js` - Test JWT token functionality
- `test-organizations-api.js` - Test organizations API endpoints
- `test-product-creation.js` - Test product creation
- `create-test-user.js` - Create test users

## Deployment Scripts
- `deploy-production.sh` - Deploy to production environment
- `deploy-staging.sh` - Deploy to staging environment
- `setup.sh` - Initial setup script

## Test Data
- `test-data/` - Contains test JSON data files

## Debug Tools
- `debug-tokens.html` - HTML page for debugging authentication tokens

## Usage Examples

### Populate Organizations (from terminal)
```bash
# Get auth token from browser: localStorage.getItem("authToken")
node scripts/populate-organizations.js YOUR_AUTH_TOKEN
```

### Reset Organizations (from browser console)
```javascript
// Copy and paste content from reset-and-populate-organizations.js
```