const fetch = require('node-fetch');

async function testPoliciesAPI() {
  try {
    console.log('Testing policies API...');
    
    // Test without auth
    const response1 = await fetch('http://localhost:3002/api/abac/policies', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response status (no auth):', response1.status);
    const text1 = await response1.text();
    console.log('Response body (no auth):', text1);
    
    // Test with a mock token (will likely fail auth but shows the flow)
    const response2 = await fetch('http://localhost:3002/api/abac/policies', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token'
      }
    });
    
    console.log('\nResponse status (with auth):', response2.status);
    const text2 = await response2.text();
    console.log('Response body (with auth):', text2);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testPoliciesAPI();