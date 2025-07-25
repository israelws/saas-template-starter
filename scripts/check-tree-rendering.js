// Quick diagnostic to check why tree isn't rendering
// Run this in browser console

console.log('=== CHECKING TREE RENDERING ===');

// Check if organizations are loaded
const orgsText = document.querySelector('.text-gray-500')?.textContent;
console.log('Empty state showing?', orgsText);

// Check for tree view vs list view
const treeViewButton = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tree View'));
console.log('Tree View button found?', !!treeViewButton);
console.log('Tree View active?', treeViewButton?.getAttribute('data-state'));

// Check for organization rows
const orgRows = document.querySelectorAll('[class*="hover:bg-muted"]');
console.log('Organization rows found:', orgRows.length);

// Check console for errors
console.log('\n=== CHECK CONSOLE FOR ERRORS ===');
console.log('Look for any red error messages above');

// Try to manually trigger the tree building
console.log('\n=== MANUAL TREE BUILD TEST ===');
const buildOrganizationTree = (organizations) => {
  const orgMap = new Map();
  const rootOrgs = [];
  
  // First pass: create all nodes
  organizations.forEach((org) => {
    orgMap.set(org.id, { ...org, children: [] });
  });
  
  // Second pass: build tree
  organizations.forEach((org) => {
    const node = orgMap.get(org.id);
    const parentId = org.parentId || org.parent?.id;
    
    if (parentId && orgMap.has(parentId)) {
      const parent = orgMap.get(parentId);
      parent.children.push(node);
    } else {
      rootOrgs.push(node);
    }
  });
  
  return rootOrgs;
};

// Fetch and test
fetch('http://localhost:3002/api/organizations?limit=100', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
})
.then(r => r.json())
.then(data => {
  const orgs = data.data || [];
  console.log('Fetched organizations:', orgs.length);
  
  // Add parentId to each org
  const orgsWithParentId = orgs.map(org => ({
    ...org,
    parentId: org.parentId || org.parent?.id || null
  }));
  
  const tree = buildOrganizationTree(orgsWithParentId);
  console.log('Root organizations:', tree.length);
  console.log('Tree structure:', tree);
  
  // Print tree
  function printTree(node, indent = '') {
    console.log(indent + node.name + ' (' + node.type + ')');
    if (node.children) {
      node.children.forEach(child => printTree(child, indent + '  '));
    }
  }
  
  console.log('\n=== EXPECTED TREE STRUCTURE ===');
  tree.forEach(root => printTree(root));
});