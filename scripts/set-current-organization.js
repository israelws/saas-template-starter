// Script to set the current organization in Redux store
// Run this in browser console to select an organization

async function setCurrentOrganization() {
  const token = localStorage.getItem('authToken');
  
  // Fetch organizations
  const response = await fetch('http://localhost:3002/api/organizations?limit=10', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  const organizations = data.data || [];
  
  if (organizations.length === 0) {
    console.error('No organizations found!');
    return;
  }
  
  console.log('Available organizations:');
  organizations.forEach((org, index) => {
    console.log(`${index + 1}. ${org.name} (${org.type}) - ID: ${org.id}`);
  });
  
  // For now, select the first company type organization
  const company = organizations.find(org => org.type === 'company') || organizations[0];
  
  console.log(`\nSelecting organization: ${company.name}`);
  
  // Dispatch to Redux store if available
  if (window.__REDUX_STORE__) {
    window.__REDUX_STORE__.dispatch({
      type: 'organization/setCurrentOrganization',
      payload: company
    });
    console.log('✓ Organization set in Redux store');
  } else {
    console.log('Redux store not found. Trying alternative method...');
    
    // Try to find the store through React DevTools
    const reactRoot = document.querySelector('#__next')?._reactRootContainer?._internalRoot?.current;
    if (reactRoot) {
      // This is a workaround - in production you'd have a proper organization selector
      console.log('Please implement a proper organization selector component');
    }
  }
  
  // Store in localStorage as backup
  localStorage.setItem('currentOrganizationId', company.id);
  localStorage.setItem('currentOrganization', JSON.stringify(company));
  
  console.log('\n✅ Current organization set to:', company.name);
  console.log('Refresh the page to see policies for this organization');
}

// Run the function
setCurrentOrganization();