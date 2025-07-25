// Debug script to check organization data structure
// Run this in browser console on the organizations page

async function debugOrganizations() {
  const token = localStorage.getItem('authToken');
  
  console.log('=== DEBUGGING ORGANIZATION DATA ===');
  
  // Fetch organizations
  const response = await fetch('http://localhost:3002/api/organizations', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  console.log('Raw API Response:', data);
  
  // Extract the organizations array
  const organizations = data.data || data;
  console.log('Organizations array:', organizations);
  
  // Check each organization's structure
  console.log('\n=== INDIVIDUAL ORGANIZATION DETAILS ===');
  organizations.forEach((org, index) => {
    console.log(`\n${index + 1}. ${org.name}:`);
    console.log('  - ID:', org.id);
    console.log('  - Type:', org.type);
    console.log('  - ParentId:', org.parentId);
    console.log('  - Parent object:', org.parent);
    console.log('  - Has parent?', !!(org.parentId || org.parent?.id));
  });
  
  // Build parent-child map
  console.log('\n=== PARENT-CHILD RELATIONSHIPS ===');
  const parentChildMap = {};
  
  organizations.forEach(org => {
    const parentId = org.parentId || org.parent?.id;
    if (parentId) {
      if (!parentChildMap[parentId]) {
        parentChildMap[parentId] = [];
      }
      parentChildMap[parentId].push(org.name);
    }
  });
  
  console.log('Parent to Children mapping:');
  Object.entries(parentChildMap).forEach(([parentId, children]) => {
    const parent = organizations.find(o => o.id === parentId);
    console.log(`\n${parent?.name || parentId}:`);
    children.forEach(child => console.log(`  - ${child}`));
  });
  
  // Find root organizations
  console.log('\n=== ROOT ORGANIZATIONS ===');
  const rootOrgs = organizations.filter(org => {
    const parentId = org.parentId || org.parent?.id;
    return !parentId;
  });
  console.log('Root organizations:', rootOrgs.map(o => o.name));
  
  // Try the hierarchy endpoint
  console.log('\n=== CHECKING HIERARCHY ENDPOINT ===');
  try {
    const hierarchyResponse = await fetch('http://localhost:3002/api/organizations/hierarchy', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (hierarchyResponse.ok) {
      const hierarchyData = await hierarchyResponse.json();
      console.log('Hierarchy endpoint response:', hierarchyData);
    } else {
      console.log('Hierarchy endpoint not available or returned error:', hierarchyResponse.status);
    }
  } catch (error) {
    console.log('Error fetching hierarchy:', error);
  }
}

// Run the debug function
debugOrganizations();