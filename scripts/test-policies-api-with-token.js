const fetch = require('node-fetch');

async function testPoliciesAPIWithToken() {
  try {
    console.log('Testing policies API with a valid-looking token...');
    
    // Create a test JWT token that looks valid but won't pass verification
    // This helps us see if the issue is with JWT validation or permissions
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    
    const response = await fetch('http://localhost:3002/api/abac/policies', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    const text = await response.text();
    console.log('Response body:', text);
    
    // Try to parse as JSON if possible
    try {
      const json = JSON.parse(text);
      console.log('Parsed response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Could not parse as JSON');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testPoliciesAPIWithToken();