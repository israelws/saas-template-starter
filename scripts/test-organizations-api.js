// Simple test script to debug organizations API
console.log('Testing organizations API...');

// Simulate what the frontend should be doing
const testAPI = async () => {
  try {
    const response = await fetch('http://localhost:3001/dashboard/organizations');
    console.log('Frontend page status:', response.status);
    
    // Now check if we can see the API call in network
    console.log('Check browser console for API debugging...');
  } catch (error) {
    console.error('Error:', error);
  }
};

testAPI();