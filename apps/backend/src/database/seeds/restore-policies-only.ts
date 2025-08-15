import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config({ path: `.env.${process.env.NODE_ENV || 'dev'}` });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'saas_template',
  synchronize: false,
});

async function restorePolicies() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection initialized');

    // Check current state
    const policiesCount = await AppDataSource.query('SELECT COUNT(*) FROM policies');
    const policySetsCount = await AppDataSource.query('SELECT COUNT(*) FROM policy_sets');
    
    console.log(`Current state: ${policiesCount[0].count} policies, ${policySetsCount[0].count} policy sets`);

    if (policiesCount[0].count === '0' && policySetsCount[0].count === '0') {
      console.log('🛡️ Restoring policies and policy sets...');
      
      // Get organizations
      const organizations = await AppDataSource.query(`
        SELECT id, code FROM organizations 
        WHERE code IN ('TECHCORP', 'ENG_DIV', 'SALES_DIV', 'RETAILMAX', 'FINFLOW')
      `);
      
      const orgMap = {};
      organizations.forEach(org => {
        orgMap[org.code] = org.id;
      });

      // Create policy sets
      const policySets = [
        { name: 'Global Access Control', description: 'Company-wide access control policies', priority: 100, status: 'active', org: 'TECHCORP' },
        { name: 'Engineering Access Control', description: 'Engineering-specific access policies', priority: 80, status: 'active', org: 'ENG_DIV' },
        { name: 'Sales Access Control', description: 'Sales team access policies', priority: 75, status: 'active', org: 'SALES_DIV' },
        { name: 'RetailMax Global Policies', description: 'Company-wide policies for RetailMax', priority: 100, status: 'active', org: 'RETAILMAX' },
        { name: 'FinanceFlow Security Policies', description: 'Financial services compliance and security policies', priority: 100, status: 'active', org: 'FINFLOW' },
        { name: 'External Consultant Policies', description: 'Policies for external consultants and contractors', priority: 60, status: 'active', org: 'TECHCORP' },
        { name: 'Security Baseline', description: 'Default security policies and access denials', priority: 10, status: 'active', org: 'TECHCORP' },
      ];

      const policySetIds = {};
      for (const ps of policySets) {
        if (orgMap[ps.org]) {
          const result = await AppDataSource.query(`
            INSERT INTO policy_sets (name, description, priority, status, "organizationId", "isActive", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
            RETURNING id
          `, [ps.name, ps.description, ps.priority, ps.status, orgMap[ps.org]]);
          policySetIds[ps.name] = result[0].id;
          console.log(`Created policy set: ${ps.name}`);
        }
      }

      // Create policies for Global Access Control
      if (policySetIds['Global Access Control'] && orgMap['TECHCORP']) {
        const policies = [
          {
            name: 'Super Admin Access',
            description: 'System administrators have full access to everything',
            resource: '*',
            actions: ['*'],
            effect: 'allow',
            conditions: {
              'subject.attributes.role': { equals: 'admin' },
              'subject.attributes.clearanceLevel': { equals: 'top-secret' },
            },
            priority: 100,
          },
          {
            name: 'Executive Access',
            description: 'Executives have broad organizational access',
            resource: 'organization:*',
            actions: ['*'],
            effect: 'allow',
            conditions: {
              'subject.attributes.role': { equals: 'executive' },
              'subject.attributes.clearanceLevel': { in: ['high', 'top-secret'] },
            },
            priority: 95,
          },
          {
            name: 'Manager Organization Management',
            description: 'Managers can manage their organization and sub-organizations',
            resource: 'organization:*',
            actions: ['read', 'update', 'manage_users'],
            effect: 'allow',
            conditions: {
              'subject.attributes.role': { equals: 'manager' },
              'context.organizationHierarchy': { contains: 'subject.organizationId' },
            },
            priority: 80,
          },
          {
            name: 'User Self Management',
            description: 'Users can view and update their own profile',
            resource: 'user:profile',
            actions: ['read', 'update'],
            effect: 'allow',
            conditions: {
              'resource.attributes.userId': { equals: 'subject.id' },
            },
            priority: 70,
          },
          {
            name: 'Default Organization Read',
            description: 'All authenticated users can read basic organization info',
            resource: 'organization:basic',
            actions: ['read'],
            effect: 'allow',
            conditions: {
              'subject.authenticated': { equals: true },
              'context.organizationMembership': { exists: true },
            },
            priority: 50,
          },
        ];

        for (const policy of policies) {
          await AppDataSource.query(`
            INSERT INTO policies (name, description, resource, actions, effect, conditions, priority, status, "organizationId", "policySetId", "isActive", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, true, NOW(), NOW())
          `, [
            policy.name,
            policy.description,
            policy.resource,
            JSON.stringify(policy.actions),
            policy.effect,
            JSON.stringify(policy.conditions),
            policy.priority,
            orgMap['TECHCORP'],
            policySetIds['Global Access Control']
          ]);
          console.log(`Created policy: ${policy.name}`);
        }
      }

      // Create policies for Engineering Division
      if (policySetIds['Engineering Access Control'] && orgMap['ENG_DIV']) {
        const policies = [
          {
            name: 'Engineering Resource Access',
            description: 'Engineering team members can access development resources',
            resource: 'development:*',
            actions: ['*'],
            effect: 'allow',
            conditions: {
              'subject.attributes.department': { equals: 'engineering' },
            },
            priority: 85,
          },
          {
            name: 'Code Repository Access',
            description: 'Developers can access code repositories',
            resource: 'repository:*',
            actions: ['read', 'write', 'create_branch'],
            effect: 'allow',
            conditions: {
              'subject.attributes.role': { in: ['developer', 'manager'] },
              'subject.attributes.department': { equals: 'engineering' },
            },
            priority: 80,
          },
        ];

        for (const policy of policies) {
          await AppDataSource.query(`
            INSERT INTO policies (name, description, resource, actions, effect, conditions, priority, status, "organizationId", "policySetId", "isActive", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, true, NOW(), NOW())
          `, [
            policy.name,
            policy.description,
            policy.resource,
            JSON.stringify(policy.actions),
            policy.effect,
            JSON.stringify(policy.conditions),
            policy.priority,
            orgMap['ENG_DIV'],
            policySetIds['Engineering Access Control']
          ]);
          console.log(`Created policy: ${policy.name}`);
        }
      }

      // Create default deny policy
      if (policySetIds['Security Baseline'] && orgMap['TECHCORP']) {
        await AppDataSource.query(`
          INSERT INTO policies (name, description, resource, actions, effect, conditions, priority, status, "organizationId", "policySetId", "isActive", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, true, NOW(), NOW())
        `, [
          'Default Deny All',
          'Deny all access by default if no other policy matches',
          '*',
          JSON.stringify(['*']),
          'deny',
          JSON.stringify({}),
          1,
          orgMap['TECHCORP'],
          policySetIds['Security Baseline']
        ]);
        console.log('Created policy: Default Deny All');
      }

      console.log('✅ Policies restored successfully!');
    } else {
      console.log('⚠️ Policies already exist, skipping restoration');
    }

    // Final count
    const finalPolicies = await AppDataSource.query('SELECT COUNT(*) FROM policies');
    const finalPolicySets = await AppDataSource.query('SELECT COUNT(*) FROM policy_sets');
    
    console.log('\n📊 Final state:');
    console.log(`- Policies: ${finalPolicies[0].count}`);
    console.log(`- Policy Sets: ${finalPolicySets[0].count}`);
    
    await AppDataSource.destroy();
    console.log('\n✅ Restoration completed successfully!');
  } catch (error) {
    console.error('Error restoring policies:', error);
    process.exit(1);
  }
}

// Run the restoration
restorePolicies();