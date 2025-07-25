// Script to reset and properly populate hierarchical organization data
// Run this in the browser console while logged in to the admin dashboard

async function deleteAllOrganizations() {
  const token = localStorage.getItem('authToken');
  
  // First, get all organizations
  const response = await fetch('http://localhost:3002/api/organizations?limit=100', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  const organizations = data.data || data;
  
  console.log(`Found ${organizations.length} organizations to delete`);
  
  // Delete each organization
  for (const org of organizations) {
    try {
      const deleteResponse = await fetch(`http://localhost:3002/api/organizations/${org.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (deleteResponse.ok) {
        console.log(`✓ Deleted: ${org.name}`);
      } else {
        console.log(`✗ Failed to delete: ${org.name}`);
      }
    } catch (error) {
      console.log(`✗ Error deleting ${org.name}:`, error);
    }
  }
}

async function createOrganization(data) {
  const token = localStorage.getItem('authToken');
  const response = await fetch('http://localhost:3002/api/organizations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create ${data.name}: ${JSON.stringify(error)}`);
  }
  
  return await response.json();
}

async function populateOrganizations() {
  try {
    console.log('Starting organization population...');
    
    // Create main company
    console.log('\n=== Creating Companies ===');
    const mainCompany = await createOrganization({
      name: 'Acme Corporation',
      code: 'ACME',
      type: 'company',
      description: 'Main company headquarters',
      isActive: true
    });
    console.log('✓ Created company:', mainCompany.name);
    
    const insuranceCompany = await createOrganization({
      name: 'Acme Insurance Co.',
      code: 'ACME-INS',
      type: 'company',
      description: 'Insurance subsidiary',
      isActive: true
    });
    console.log('✓ Created company:', insuranceCompany.name);
    
    // Wait a bit to ensure companies are saved
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create divisions under the main company
    console.log('\n=== Creating Divisions ===');
    const salesDivision = await createOrganization({
      name: 'Sales Division',
      code: 'SALES',
      type: 'division',
      description: 'Sales and customer relations',
      parentId: mainCompany.id,
      isActive: true
    });
    console.log('✓ Created division:', salesDivision.name, '(parent:', mainCompany.name, ')');
    
    const techDivision = await createOrganization({
      name: 'Technology Division',
      code: 'TECH',
      type: 'division',
      description: 'IT and software development',
      parentId: mainCompany.id,
      isActive: true
    });
    console.log('✓ Created division:', techDivision.name, '(parent:', mainCompany.name, ')');
    
    const opsDivision = await createOrganization({
      name: 'Operations Division',
      code: 'OPS',
      type: 'division',
      description: 'Business operations and logistics',
      parentId: mainCompany.id,
      isActive: true
    });
    console.log('✓ Created division:', opsDivision.name, '(parent:', mainCompany.name, ')');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create departments under divisions
    console.log('\n=== Creating Departments ===');
    const salesDept = await createOrganization({
      name: 'Enterprise Sales',
      code: 'ENT-SALES',
      type: 'department',
      description: 'Enterprise customer sales',
      parentId: salesDivision.id,
      isActive: true
    });
    console.log('✓ Created department:', salesDept.name, '(parent:', salesDivision.name, ')');
    
    const marketingDept = await createOrganization({
      name: 'Marketing',
      code: 'MARKETING',
      type: 'department',
      description: 'Marketing and promotions',
      parentId: salesDivision.id,
      isActive: true
    });
    console.log('✓ Created department:', marketingDept.name, '(parent:', salesDivision.name, ')');
    
    const devDept = await createOrganization({
      name: 'Software Development',
      code: 'DEV',
      type: 'department',
      description: 'Software engineering teams',
      parentId: techDivision.id,
      isActive: true
    });
    console.log('✓ Created department:', devDept.name, '(parent:', techDivision.name, ')');
    
    const itDept = await createOrganization({
      name: 'IT Infrastructure',
      code: 'IT-INFRA',
      type: 'department',
      description: 'IT infrastructure and support',
      parentId: techDivision.id,
      isActive: true
    });
    console.log('✓ Created department:', itDept.name, '(parent:', techDivision.name, ')');
    
    const hrDept = await createOrganization({
      name: 'Human Resources',
      code: 'HR',
      type: 'department',
      description: 'HR and talent management',
      parentId: opsDivision.id,
      isActive: true
    });
    console.log('✓ Created department:', hrDept.name, '(parent:', opsDivision.name, ')');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create teams under departments
    console.log('\n=== Creating Teams ===');
    await createOrganization({
      name: 'East Coast Sales',
      code: 'SALES-EAST',
      type: 'team',
      description: 'East coast enterprise sales',
      parentId: salesDept.id,
      isActive: true
    });
    console.log('✓ Created team: East Coast Sales (parent:', salesDept.name, ')');
    
    await createOrganization({
      name: 'West Coast Sales',
      code: 'SALES-WEST',
      type: 'team',
      description: 'West coast enterprise sales',
      parentId: salesDept.id,
      isActive: true
    });
    console.log('✓ Created team: West Coast Sales (parent:', salesDept.name, ')');
    
    await createOrganization({
      name: 'Digital Marketing',
      code: 'DIG-MARK',
      type: 'team',
      description: 'Digital marketing and social media',
      parentId: marketingDept.id,
      isActive: true
    });
    console.log('✓ Created team: Digital Marketing (parent:', marketingDept.name, ')');
    
    await createOrganization({
      name: 'Frontend Team',
      code: 'FRONTEND',
      type: 'team',
      description: 'Frontend web development',
      parentId: devDept.id,
      isActive: true
    });
    console.log('✓ Created team: Frontend Team (parent:', devDept.name, ')');
    
    await createOrganization({
      name: 'Backend Team',
      code: 'BACKEND',
      type: 'team',
      description: 'Backend services development',
      parentId: devDept.id,
      isActive: true
    });
    console.log('✓ Created team: Backend Team (parent:', devDept.name, ')');
    
    await createOrganization({
      name: 'DevOps',
      code: 'DEVOPS',
      type: 'team',
      description: 'DevOps and infrastructure automation',
      parentId: itDept.id,
      isActive: true
    });
    console.log('✓ Created team: DevOps (parent:', itDept.name, ')');
    
    // Create insurance agencies under insurance company
    console.log('\n=== Creating Insurance Agencies ===');
    const northAgency = await createOrganization({
      name: 'North Region Agency',
      code: 'INS-NORTH',
      type: 'insurance_agency',
      description: 'Insurance agency for north region',
      parentId: insuranceCompany.id,
      isActive: true
    });
    console.log('✓ Created insurance agency:', northAgency.name, '(parent:', insuranceCompany.name, ')');
    
    const southAgency = await createOrganization({
      name: 'South Region Agency',
      code: 'INS-SOUTH',
      type: 'insurance_agency',
      description: 'Insurance agency for south region',
      parentId: insuranceCompany.id,
      isActive: true
    });
    console.log('✓ Created insurance agency:', southAgency.name, '(parent:', insuranceCompany.name, ')');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create insurance branches under agencies
    console.log('\n=== Creating Insurance Branches ===');
    await createOrganization({
      name: 'Downtown Branch',
      code: 'INS-N-DT',
      type: 'insurance_branch',
      description: 'Downtown insurance branch',
      parentId: northAgency.id,
      isActive: true
    });
    console.log('✓ Created insurance branch: Downtown Branch (parent:', northAgency.name, ')');
    
    await createOrganization({
      name: 'Uptown Branch',
      code: 'INS-N-UT',
      type: 'insurance_branch',
      description: 'Uptown insurance branch',
      parentId: northAgency.id,
      isActive: true
    });
    console.log('✓ Created insurance branch: Uptown Branch (parent:', northAgency.name, ')');
    
    await createOrganization({
      name: 'Metro Branch',
      code: 'INS-S-MT',
      type: 'insurance_branch',
      description: 'Metro area insurance branch',
      parentId: southAgency.id,
      isActive: true
    });
    console.log('✓ Created insurance branch: Metro Branch (parent:', southAgency.name, ')');
    
    console.log('\n✅ Organization hierarchy created successfully!');
    console.log('Refreshing the page in 3 seconds...');
    
    // Refresh the page to see the new hierarchy
    setTimeout(() => {
      window.location.reload();
    }, 3000);
    
  } catch (error) {
    console.error('❌ Error creating organizations:', error);
  }
}

async function resetAndPopulate() {
  console.log('=== RESETTING ORGANIZATIONS ===');
  console.log('Deleting all existing organizations...\n');
  
  await deleteAllOrganizations();
  
  console.log('\n=== POPULATING NEW ORGANIZATIONS ===');
  console.log('Waiting 2 seconds before creating new organizations...');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await populateOrganizations();
}

// Run the reset and population
resetAndPopulate();