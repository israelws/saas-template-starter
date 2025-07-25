// Script to populate hierarchical organization data
// Run this in the browser console while logged in to the admin dashboard

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
    throw new Error(`Failed to create ${data.name}: ${error.message}`);
  }
  
  return await response.json();
}

async function populateOrganizations() {
  try {
    console.log('Starting organization population...');
    
    // Create main company
    console.log('Creating main company...');
    const mainCompany = await createOrganization({
      name: 'Acme Corporation',
      code: 'ACME',
      type: 'company',
      description: 'Main company headquarters',
      isActive: true
    });
    console.log('✓ Created main company:', mainCompany.name);
    
    // Create divisions under the main company
    console.log('Creating divisions...');
    const salesDivision = await createOrganization({
      name: 'Sales Division',
      code: 'SALES',
      type: 'division',
      description: 'Sales and customer relations',
      parentId: mainCompany.id,
      isActive: true
    });
    console.log('✓ Created division:', salesDivision.name);
    
    const techDivision = await createOrganization({
      name: 'Technology Division',
      code: 'TECH',
      type: 'division',
      description: 'IT and software development',
      parentId: mainCompany.id,
      isActive: true
    });
    console.log('✓ Created division:', techDivision.name);
    
    const opsDivision = await createOrganization({
      name: 'Operations Division',
      code: 'OPS',
      type: 'division',
      description: 'Business operations and logistics',
      parentId: mainCompany.id,
      isActive: true
    });
    console.log('✓ Created division:', opsDivision.name);
    
    // Create departments under divisions
    console.log('Creating departments...');
    const salesDept = await createOrganization({
      name: 'Enterprise Sales Department',
      code: 'ENT-SALES',
      type: 'department',
      description: 'Enterprise customer sales',
      parentId: salesDivision.id,
      isActive: true
    });
    console.log('✓ Created department:', salesDept.name);
    
    const marketingDept = await createOrganization({
      name: 'Marketing Department',
      code: 'MARKETING',
      type: 'department',
      description: 'Marketing and promotions',
      parentId: salesDivision.id,
      isActive: true
    });
    console.log('✓ Created department:', marketingDept.name);
    
    const devDept = await createOrganization({
      name: 'Software Development Department',
      code: 'DEV',
      type: 'department',
      description: 'Software engineering teams',
      parentId: techDivision.id,
      isActive: true
    });
    console.log('✓ Created department:', devDept.name);
    
    const itDept = await createOrganization({
      name: 'IT Infrastructure Department',
      code: 'IT-INFRA',
      type: 'department',
      description: 'IT infrastructure and support',
      parentId: techDivision.id,
      isActive: true
    });
    console.log('✓ Created department:', itDept.name);
    
    const hrDept = await createOrganization({
      name: 'Human Resources Department',
      code: 'HR',
      type: 'department',
      description: 'HR and talent management',
      parentId: opsDivision.id,
      isActive: true
    });
    console.log('✓ Created department:', hrDept.name);
    
    // Create teams under departments
    console.log('Creating teams...');
    await createOrganization({
      name: 'Enterprise Sales Team - East',
      code: 'ENT-EAST',
      type: 'team',
      description: 'East coast enterprise sales',
      parentId: salesDept.id,
      isActive: true
    });
    console.log('✓ Created team: Enterprise Sales Team - East');
    
    await createOrganization({
      name: 'Enterprise Sales Team - West',
      code: 'ENT-WEST',
      type: 'team',
      description: 'West coast enterprise sales',
      parentId: salesDept.id,
      isActive: true
    });
    console.log('✓ Created team: Enterprise Sales Team - West');
    
    await createOrganization({
      name: 'Digital Marketing Team',
      code: 'DIG-MARK',
      type: 'team',
      description: 'Digital marketing and social media',
      parentId: marketingDept.id,
      isActive: true
    });
    console.log('✓ Created team: Digital Marketing Team');
    
    await createOrganization({
      name: 'Frontend Development Team',
      code: 'FRONTEND',
      type: 'team',
      description: 'Frontend web development',
      parentId: devDept.id,
      isActive: true
    });
    console.log('✓ Created team: Frontend Development Team');
    
    await createOrganization({
      name: 'Backend Development Team',
      code: 'BACKEND',
      type: 'team',
      description: 'Backend services development',
      parentId: devDept.id,
      isActive: true
    });
    console.log('✓ Created team: Backend Development Team');
    
    await createOrganization({
      name: 'DevOps Team',
      code: 'DEVOPS',
      type: 'team',
      description: 'DevOps and infrastructure automation',
      parentId: itDept.id,
      isActive: true
    });
    console.log('✓ Created team: DevOps Team');
    
    await createOrganization({
      name: 'IT Support Team',
      code: 'IT-SUPPORT',
      type: 'team',
      description: 'IT helpdesk and support',
      parentId: itDept.id,
      isActive: true
    });
    console.log('✓ Created team: IT Support Team');
    
    await createOrganization({
      name: 'Talent Acquisition Team',
      code: 'TALENT-ACQ',
      type: 'team',
      description: 'Recruitment and hiring',
      parentId: hrDept.id,
      isActive: true
    });
    console.log('✓ Created team: Talent Acquisition Team');
    
    // Create insurance organizations (separate hierarchy)
    console.log('Creating insurance company...');
    const insuranceCompany = await createOrganization({
      name: 'Acme Insurance Co.',
      code: 'ACME-INS',
      type: 'company',
      description: 'Insurance subsidiary',
      isActive: true
    });
    console.log('✓ Created insurance company:', insuranceCompany.name);
    
    // Create insurance agencies under insurance company
    console.log('Creating insurance agencies...');
    const northAgency = await createOrganization({
      name: 'North Region Insurance Agency',
      code: 'INS-NORTH',
      type: 'insurance_agency',
      description: 'Insurance agency for north region',
      parentId: insuranceCompany.id,
      isActive: true
    });
    console.log('✓ Created insurance agency:', northAgency.name);
    
    const southAgency = await createOrganization({
      name: 'South Region Insurance Agency',
      code: 'INS-SOUTH',
      type: 'insurance_agency',
      description: 'Insurance agency for south region',
      parentId: insuranceCompany.id,
      isActive: true
    });
    console.log('✓ Created insurance agency:', southAgency.name);
    
    // Create insurance branches under agencies
    console.log('Creating insurance branches...');
    await createOrganization({
      name: 'North Agency - Downtown Branch',
      code: 'INS-N-DT',
      type: 'insurance_branch',
      description: 'Downtown insurance branch',
      parentId: northAgency.id,
      isActive: true
    });
    console.log('✓ Created insurance branch: North Agency - Downtown Branch');
    
    await createOrganization({
      name: 'North Agency - Uptown Branch',
      code: 'INS-N-UT',
      type: 'insurance_branch',
      description: 'Uptown insurance branch',
      parentId: northAgency.id,
      isActive: true
    });
    console.log('✓ Created insurance branch: North Agency - Uptown Branch');
    
    await createOrganization({
      name: 'South Agency - Metro Branch',
      code: 'INS-S-MT',
      type: 'insurance_branch',
      description: 'Metro area insurance branch',
      parentId: southAgency.id,
      isActive: true
    });
    console.log('✓ Created insurance branch: South Agency - Metro Branch');
    
    console.log('✅ Organization hierarchy created successfully!');
    console.log('Refreshing the page...');
    
    // Refresh the page to see the new hierarchy
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error creating organizations:', error);
  }
}

// Run the population
populateOrganizations();