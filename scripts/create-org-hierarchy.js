// Script to create a hierarchical organization structure
// Run this after logging in to create child organizations

async function createOrganizationHierarchy() {
  const authToken = localStorage.getItem('authToken');
  
  if (!authToken) {
    console.error('Please login first!');
    return;
  }

  const API_URL = 'http://localhost:3002/api';
  
  // Helper function to create organization
  async function createOrg(orgData) {
    try {
      const response = await fetch(`${API_URL}/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(orgData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to create org:', orgData.name, error);
        return null;
      }
      
      const result = await response.json();
      console.log('Created:', result.name, '(' + result.type + ')');
      return result;
    } catch (error) {
      console.error('Error creating org:', error);
      return null;
    }
  }

  // Get existing companies to use as parents
  const existingOrgsResponse = await fetch(`${API_URL}/organizations?limit=100`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  const existingOrgs = await existingOrgsResponse.json();
  console.log('Existing organizations:', existingOrgs);
  
  // Find companies to use as parents
  const companies = existingOrgs.data.filter(org => org.type === 'company' && org.isActive);
  
  if (companies.length === 0) {
    console.error('No companies found to create hierarchy under!');
    return;
  }

  // Use the first few companies
  const techCorp = companies.find(c => c.name.includes('comp 3')) || companies[0];
  const retailMax = companies.find(c => c.name.includes('FinanceFlow')) || companies[1];
  
  console.log('Creating hierarchy under:', techCorp.name);

  // Create divisions under TechCorp
  const engineering = await createOrg({
    name: 'Engineering Division',
    code: 'ENG_DIV',
    description: 'Engineering and Product Development',
    type: 'division',
    parentId: techCorp.id,
    isActive: true
  });

  const sales = await createOrg({
    name: 'Sales Division',
    code: 'SALES_DIV',
    description: 'Sales and Business Development',
    type: 'division',
    parentId: techCorp.id,
    isActive: true
  });

  const marketing = await createOrg({
    name: 'Marketing Division',
    code: 'MARK_DIV',
    description: 'Marketing and Brand Management',
    type: 'division',
    parentId: techCorp.id,
    isActive: true
  });

  // Create departments under Engineering Division
  if (engineering) {
    const backend = await createOrg({
      name: 'Backend Department',
      code: 'BACKEND_DEPT',
      description: 'Backend Development Department',
      type: 'department',
      parentId: engineering.id,
      isActive: true
    });

    const frontend = await createOrg({
      name: 'Frontend Department',
      code: 'FRONTEND_DEPT',
      description: 'Frontend Development Department',
      type: 'department',
      parentId: engineering.id,
      isActive: true
    });

    const qa = await createOrg({
      name: 'QA Department',
      code: 'QA_DEPT',
      description: 'Quality Assurance Department',
      type: 'department',
      parentId: engineering.id,
      isActive: true
    });

    // Create teams under Backend Department
    if (backend) {
      await createOrg({
        name: 'API Team',
        code: 'API_TEAM',
        description: 'API Development Team',
        type: 'team',
        parentId: backend.id,
        isActive: true
      });

      await createOrg({
        name: 'Database Team',
        code: 'DB_TEAM',
        description: 'Database Management Team',
        type: 'team',
        parentId: backend.id,
        isActive: true
      });
    }

    // Create teams under Frontend Department
    if (frontend) {
      await createOrg({
        name: 'UI/UX Team',
        code: 'UIUX_TEAM',
        description: 'User Interface and Experience Team',
        type: 'team',
        parentId: frontend.id,
        isActive: true
      });

      await createOrg({
        name: 'Mobile Team',
        code: 'MOBILE_TEAM',
        description: 'Mobile Development Team',
        type: 'team',
        parentId: frontend.id,
        isActive: true
      });
    }
  }

  // Create departments under Sales Division
  if (sales) {
    const enterprise = await createOrg({
      name: 'Enterprise Sales',
      code: 'ENT_SALES',
      description: 'Enterprise Sales Department',
      type: 'department',
      parentId: sales.id,
      isActive: true
    });

    const smb = await createOrg({
      name: 'SMB Sales',
      code: 'SMB_SALES',
      description: 'Small & Medium Business Sales',
      type: 'department',
      parentId: sales.id,
      isActive: true
    });

    // Create teams under Enterprise Sales
    if (enterprise) {
      await createOrg({
        name: 'EMEA Sales Team',
        code: 'EMEA_TEAM',
        description: 'Europe, Middle East & Africa Sales',
        type: 'team',
        parentId: enterprise.id,
        isActive: true
      });

      await createOrg({
        name: 'Americas Sales Team',
        code: 'AMERICAS_TEAM',
        description: 'North & South America Sales',
        type: 'team',
        parentId: enterprise.id,
        isActive: true
      });
    }
  }

  // Create Insurance Agency structure if FinanceFlow exists
  if (retailMax && retailMax.type === 'company') {
    const agency = await createOrg({
      name: 'Premier Insurance Agency',
      code: 'PREMIER_INS',
      description: 'Premier Insurance Services',
      type: 'insurance_agency',
      parentId: retailMax.id,
      isActive: true
    });

    if (agency) {
      await createOrg({
        name: 'Downtown Branch',
        code: 'DOWNTOWN_BR',
        description: 'Downtown Insurance Branch',
        type: 'insurance_branch',
        parentId: agency.id,
        isActive: true
      });

      await createOrg({
        name: 'Westside Branch',
        code: 'WEST_BR',
        description: 'Westside Insurance Branch',
        type: 'insurance_branch',
        parentId: agency.id,
        isActive: true
      });
    }
  }

  console.log('Organization hierarchy created successfully!');
  console.log('Refresh the page to see the tree view.');
}

// Run the function
createOrganizationHierarchy();