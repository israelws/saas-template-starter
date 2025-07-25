// Diagnostic script to check organization tree structure
// Run this in browser console

async function diagnoseTree() {
  const token = localStorage.getItem('authToken');
  
  console.log('=== DIAGNOSING TREE STRUCTURE ===\n');
  
  // Fetch organizations
  const response = await fetch('http://localhost:3002/api/organizations?limit=100', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  const organizations = data.data || [];
  
  console.log(`Total organizations: ${organizations.length}\n`);
  
  // Group by parent
  const byParent = {};
  const roots = [];
  
  organizations.forEach(org => {
    console.log(`${org.name}:`);
    console.log(`  - ID: ${org.id}`);
    console.log(`  - Type: ${org.type}`);
    console.log(`  - ParentId: ${org.parentId}`);
    console.log(`  - Parent: ${org.parent ? `{id: ${org.parent.id}, name: ${org.parent.name}}` : 'null'}`);
    console.log('');
    
    const parentId = org.parentId || org.parent?.id;
    
    if (!parentId) {
      roots.push(org);
    } else {
      if (!byParent[parentId]) {
        byParent[parentId] = [];
      }
      byParent[parentId].push(org);
    }
  });
  
  console.log('\n=== TREE STRUCTURE ===\n');
  console.log(`Root organizations: ${roots.length}`);
  roots.forEach(root => console.log(`  - ${root.name} (${root.type})`));
  
  console.log('\n=== PARENT-CHILD RELATIONSHIPS ===\n');
  
  function printTree(org, indent = '') {
    console.log(`${indent}${org.name} (${org.type})`);
    const children = byParent[org.id] || [];
    children.forEach(child => printTree(child, indent + '  '));
  }
  
  roots.forEach(root => {
    printTree(root);
    console.log('');
  });
  
  // Check the actual tree building in the page
  console.log('\n=== CHECKING PAGE TREE BUILDING ===\n');
  
  // Try to access the buildOrganizationTree function if it exists
  if (typeof buildOrganizationTree === 'function') {
    const tree = buildOrganizationTree(organizations);
    console.log('Tree built by page:', tree);
  } else {
    console.log('buildOrganizationTree function not accessible from console');
  }
}

diagnoseTree();