// Test script to verify product creation with variants and inventory
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// Test data
const testProduct = {
  sku: 'TEST-PROD-001',
  name: 'Test Product with Variants',
  description: 'Testing product creation with variants and inventory',
  category: 'electronics',
  price: 99.99,
  organizationId: 'YOUR_ORG_ID', // Replace with actual organization ID
  inventory: {
    quantity: 100,
    reserved: 0,
    available: 100,
    reorderLevel: 10,
    reorderQuantity: 50,
    location: 'Warehouse A'
  },
  variants: [
    {
      sku: 'TEST-VAR-001',
      name: 'Large Blue',
      price: 109.99,
      inventory: {
        quantity: 50,
        reserved: 0,
        available: 50,
        reorderLevel: 5,
        reorderQuantity: 25,
        location: 'Warehouse A'
      },
      attributes: {
        size: 'Large',
        color: 'Blue',
        material: 'Cotton'
      },
      isActive: true
    },
    {
      sku: 'TEST-VAR-002',
      name: 'Small Red',
      price: 89.99,
      inventory: {
        quantity: 30,
        reserved: 0,
        available: 30,
        reorderLevel: 5,
        reorderQuantity: 20,
        location: 'Warehouse B'
      },
      attributes: {
        size: 'Small',
        color: 'Red',
        material: 'Polyester'
      },
      isActive: true
    }
  ],
  images: [
    {
      url: 'https://example.com/image1.jpg',
      alt: 'Product main image',
      isPrimary: true,
      order: 0
    },
    {
      url: 'https://example.com/image2.jpg',
      alt: 'Product side view',
      isPrimary: false,
      order: 1
    }
  ]
};

async function testProductCreation() {
  try {
    console.log('Creating product with variants and inventory...');
    console.log('Test data:', JSON.stringify(testProduct, null, 2));
    
    // Note: You'll need to add authentication headers
    const response = await axios.post(`${API_URL}/products`, testProduct, {
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN', // Replace with actual token
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\nProduct created successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Verify the created product
    const productId = response.data.id;
    console.log('\nFetching created product...');
    
    const getResponse = await axios.get(`${API_URL}/products/${productId}`, {
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN' // Replace with actual token
      }
    });
    
    console.log('\nRetrieved product:');
    console.log('- Inventory:', JSON.stringify(getResponse.data.inventory, null, 2));
    console.log('- Variants:', JSON.stringify(getResponse.data.variants, null, 2));
    console.log('- Images:', JSON.stringify(getResponse.data.images, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Run the test
testProductCreation();

console.log(`
=====================================
MANUAL TESTING INSTRUCTIONS:
=====================================
1. Replace YOUR_ORG_ID with an actual organization ID from your database
2. Replace YOUR_ACCESS_TOKEN with a valid JWT token
3. Run: node test-product-creation.js

Or test via the Admin Dashboard UI:
1. Go to Products page
2. Click "New Product"
3. Fill in basic info
4. Go to Variants tab and add variants with inventory
5. Save and check if variants and inventory are persisted
=====================================
`);