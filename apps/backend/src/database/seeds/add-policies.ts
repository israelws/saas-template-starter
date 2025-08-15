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

async function addPolicies() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection initialized');

    // Get policy sets
    const policySets = await AppDataSource.query(`
      SELECT ps.id, ps.name, ps."organizationId" 
      FROM policy_sets ps
      ORDER BY ps.name
    `);
    
    console.log(`Found ${policySets.length} policy sets`);

    // Create a map of policy sets
    const policySetMap = {};
    policySets.forEach(ps => {
      policySetMap[ps.name] = ps;
    });

    // Add policies for Global Access Control
    if (policySetMap['Global Access Control']) {
      const policies = [
        {
          name: 'Super Admin Full Access',
          description: 'System administrators have full access to everything',
          scope: 'organization',
          effect: 'allow',
          priority: 100,
          subjects: { roles: ['super_admin'], attributes: { clearanceLevel: 'top-secret' } },
          resources: { types: ['*'] },
          actions: ['*'],
          conditions: {},
        },
        {
          name: 'Admin Organization Access',
          description: 'Admins have full access to their organization',
          scope: 'organization',
          effect: 'allow',
          priority: 95,
          subjects: { roles: ['admin'] },
          resources: { types: ['organization', 'user', 'policy', 'attribute'] },
          actions: ['*'],
          conditions: {},
        },
        {
          name: 'Manager Team Access',
          description: 'Managers can manage their teams',
          scope: 'organization',
          effect: 'allow',
          priority: 80,
          subjects: { roles: ['manager'] },
          resources: { types: ['user', 'team', 'project'] },
          actions: ['read', 'update', 'create'],
          conditions: {},
        },
        {
          name: 'User Self Management',
          description: 'Users can manage their own profile',
          scope: 'organization',
          effect: 'allow',
          priority: 70,
          subjects: { roles: ['user', 'manager', 'admin'] },
          resources: { types: ['profile'], attributes: { ownerId: '{{subject.id}}' } },
          actions: ['read', 'update'],
          conditions: {},
        },
        {
          name: 'Guest Read Only',
          description: 'Guests have read-only access to public resources',
          scope: 'organization',
          effect: 'allow',
          priority: 50,
          subjects: { roles: ['guest'] },
          resources: { types: ['public'] },
          actions: ['read'],
          conditions: {},
        },
      ];

      for (const policy of policies) {
        const existingPolicy = await AppDataSource.query(`
          SELECT id FROM policies WHERE name = $1 AND "policySetId" = $2
        `, [policy.name, policySetMap['Global Access Control'].id]);

        if (existingPolicy.length === 0) {
          await AppDataSource.query(`
            INSERT INTO policies (
              name, description, scope, effect, priority, 
              subjects, resources, actions, conditions,
              "organizationId", "policySetId", "isActive", version,
              "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, 1, NOW(), NOW())
          `, [
            policy.name,
            policy.description,
            policy.scope,
            policy.effect,
            policy.priority,
            JSON.stringify(policy.subjects),
            JSON.stringify(policy.resources),
            policy.actions,
            JSON.stringify(policy.conditions),
            policySetMap['Global Access Control'].organizationId,
            policySetMap['Global Access Control'].id
          ]);
          console.log(`✓ Created policy: ${policy.name}`);
        } else {
          console.log(`⚠ Policy already exists: ${policy.name}`);
        }
      }
    }

    // Add policies for Engineering Access Control
    if (policySetMap['Engineering Access Control']) {
      const policies = [
        {
          name: 'Developer Code Access',
          description: 'Developers can access and modify code repositories',
          scope: 'organization',
          effect: 'allow',
          priority: 85,
          subjects: { roles: ['user'], attributes: { department: 'engineering' } },
          resources: { types: ['repository', 'code', 'documentation'] },
          actions: ['read', 'write', 'commit', 'push'],
          conditions: {},
        },
        {
          name: 'Engineering Manager Deploy',
          description: 'Engineering managers can deploy to production',
          scope: 'organization',
          effect: 'allow',
          priority: 90,
          subjects: { roles: ['manager'], attributes: { department: 'engineering' } },
          resources: { types: ['deployment', 'infrastructure'] },
          actions: ['*'],
          conditions: {},
        },
      ];

      for (const policy of policies) {
        const existingPolicy = await AppDataSource.query(`
          SELECT id FROM policies WHERE name = $1 AND "policySetId" = $2
        `, [policy.name, policySetMap['Engineering Access Control'].id]);

        if (existingPolicy.length === 0) {
          await AppDataSource.query(`
            INSERT INTO policies (
              name, description, scope, effect, priority, 
              subjects, resources, actions, conditions,
              "organizationId", "policySetId", "isActive", version,
              "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, 1, NOW(), NOW())
          `, [
            policy.name,
            policy.description,
            policy.scope,
            policy.effect,
            policy.priority,
            JSON.stringify(policy.subjects),
            JSON.stringify(policy.resources),
            policy.actions,
            JSON.stringify(policy.conditions),
            policySetMap['Engineering Access Control'].organizationId,
            policySetMap['Engineering Access Control'].id
          ]);
          console.log(`✓ Created policy: ${policy.name}`);
        } else {
          console.log(`⚠ Policy already exists: ${policy.name}`);
        }
      }
    }

    // Add policies for Sales Access Control
    if (policySetMap['Sales Access Control']) {
      const policies = [
        {
          name: 'Sales Customer Access',
          description: 'Sales team can manage customer data',
          scope: 'organization',
          effect: 'allow',
          priority: 80,
          subjects: { roles: ['user'], attributes: { department: 'sales' } },
          resources: { types: ['customer', 'lead', 'opportunity'] },
          actions: ['read', 'create', 'update'],
          conditions: {},
        },
        {
          name: 'Sales Manager Reports',
          description: 'Sales managers can access sales reports',
          scope: 'organization',
          effect: 'allow',
          priority: 85,
          subjects: { roles: ['manager'], attributes: { department: 'sales' } },
          resources: { types: ['report', 'analytics', 'dashboard'] },
          actions: ['read', 'export'],
          conditions: {},
        },
      ];

      for (const policy of policies) {
        const existingPolicy = await AppDataSource.query(`
          SELECT id FROM policies WHERE name = $1 AND "policySetId" = $2
        `, [policy.name, policySetMap['Sales Access Control'].id]);

        if (existingPolicy.length === 0) {
          await AppDataSource.query(`
            INSERT INTO policies (
              name, description, scope, effect, priority, 
              subjects, resources, actions, conditions,
              "organizationId", "policySetId", "isActive", version,
              "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, 1, NOW(), NOW())
          `, [
            policy.name,
            policy.description,
            policy.scope,
            policy.effect,
            policy.priority,
            JSON.stringify(policy.subjects),
            JSON.stringify(policy.resources),
            policy.actions,
            JSON.stringify(policy.conditions),
            policySetMap['Sales Access Control'].organizationId,
            policySetMap['Sales Access Control'].id
          ]);
          console.log(`✓ Created policy: ${policy.name}`);
        } else {
          console.log(`⚠ Policy already exists: ${policy.name}`);
        }
      }
    }

    // Add default deny policy to Security Baseline
    if (policySetMap['Security Baseline']) {
      const policies = [
        {
          name: 'Default Deny All',
          description: 'Deny all access by default',
          scope: 'organization',
          effect: 'deny',
          priority: 1,
          subjects: { roles: ['*'] },
          resources: { types: ['*'] },
          actions: ['*'],
          conditions: {},
        },
        {
          name: 'Block Suspended Users',
          description: 'Deny access to suspended users',
          scope: 'organization',
          effect: 'deny',
          priority: 999,
          subjects: { attributes: { status: 'suspended' } },
          resources: { types: ['*'] },
          actions: ['*'],
          conditions: {},
        },
      ];

      for (const policy of policies) {
        const existingPolicy = await AppDataSource.query(`
          SELECT id FROM policies WHERE name = $1 AND "policySetId" = $2
        `, [policy.name, policySetMap['Security Baseline'].id]);

        if (existingPolicy.length === 0) {
          await AppDataSource.query(`
            INSERT INTO policies (
              name, description, scope, effect, priority, 
              subjects, resources, actions, conditions,
              "organizationId", "policySetId", "isActive", version,
              "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, 1, NOW(), NOW())
          `, [
            policy.name,
            policy.description,
            policy.scope,
            policy.effect,
            policy.priority,
            JSON.stringify(policy.subjects),
            JSON.stringify(policy.resources),
            policy.actions,
            JSON.stringify(policy.conditions),
            policySetMap['Security Baseline'].organizationId,
            policySetMap['Security Baseline'].id
          ]);
          console.log(`✓ Created policy: ${policy.name}`);
        } else {
          console.log(`⚠ Policy already exists: ${policy.name}`);
        }
      }
    }

    // Final count
    const finalPolicies = await AppDataSource.query('SELECT COUNT(*) FROM policies');
    const finalPolicySets = await AppDataSource.query('SELECT COUNT(*) FROM policy_sets');
    
    console.log('\n📊 Final state:');
    console.log(`- Policies: ${finalPolicies[0].count}`);
    console.log(`- Policy Sets: ${finalPolicySets[0].count}`);
    
    await AppDataSource.destroy();
    console.log('\n✅ Policies added successfully!');
  } catch (error) {
    console.error('Error adding policies:', error);
    process.exit(1);
  }
}

// Run the script
addPolicies();