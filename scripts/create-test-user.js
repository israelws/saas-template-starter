// Quick script to create a test user
// Run with: node create-test-user.js

const axios = require('axios');

async function createTestUser() {
  try {
    // First, try to create a test user
    const response = await axios.post('http://localhost:3002/api/auth/register', {
      email: 'admin@test.com',
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'Admin',
      organizationId: null // Will be set after we create an organization
    });
    
    console.log('Test user created successfully!');
    console.log('Email: admin@test.com');
    console.log('Password: Test123!@#');
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('User already exists. You can login with:');
      console.log('Email: admin@test.com');
      console.log('Password: Test123!@#');
    } else {
      console.error('Error creating user:', error.response?.data || error.message);
    }
  }
}

createTestUser();