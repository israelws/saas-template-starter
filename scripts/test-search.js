const axios = require('axios');

async function testSearch() {
  try {
    // First try to create a user
    try {
      const registerResponse = await axios.post('http://localhost:3002/api/auth/register', {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'Test123!',
        organizationId: null // Will be set during registration
      });
      console.log('User created successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('User already exists');
      } else {
        console.error('Register error:', error.response?.data || error.message);
      }
    }
    
    // Now login to get a valid token
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'test@example.com',
      password: 'Test123!'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('Got token:', token.substring(0, 50) + '...');
    
    // Test search endpoint
    const searchResponse = await axios.get('http://localhost:3002/api/organizations/search', {
      params: {
        name: 'com',
        limit: 10
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Search successful:', searchResponse.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response?.status === 400) {
      console.error('Full error response:', error.response);
    }
  }
}

testSearch();