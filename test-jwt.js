// Quick script to test JWT token validation
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Get token from command line argument or prompt
const token = process.argv[2];

if (!token) {
  console.log('Usage: node test-jwt.js <JWT_TOKEN>');
  console.log('Copy your JWT token from browser localStorage (authToken) and pass it as argument');
  process.exit(1);
}

// Decode without verification first
try {
  const decoded = jwt.decode(token, { complete: true });
  console.log('\n=== JWT Header ===');
  console.log(JSON.stringify(decoded.header, null, 2));
  console.log('\n=== JWT Payload ===');
  console.log(JSON.stringify(decoded.payload, null, 2));
  
  // Check expiration
  if (decoded.payload.exp) {
    const exp = new Date(decoded.payload.exp * 1000);
    console.log(`\nToken expires at: ${exp}`);
    console.log(`Token is expired: ${Date.now() > exp.getTime()}`);
  }
  
  // Check issuer
  console.log(`\nIssuer: ${decoded.payload.iss}`);
  console.log(`Subject: ${decoded.payload.sub}`);
  
} catch (error) {
  console.error('Failed to decode JWT:', error.message);
}