#!/usr/bin/env node

/**
 * Script to fix email verification status for existing Cognito users
 * This ensures all confirmed users can use the forgot password feature
 */

const { 
  CognitoIdentityProviderClient, 
  ListUsersCommand,
  AdminUpdateUserAttributesCommand 
} = require('@aws-sdk/client-cognito-identity-provider');

const USER_POOL_ID = 'us-east-1_gWcQjDQN5';
const REGION = 'us-east-1';

const client = new CognitoIdentityProviderClient({ region: REGION });

async function fixEmailVerification() {
  try {
    console.log('Fetching users from Cognito...');
    
    // Get all users
    const listCommand = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Limit: 60
    });
    
    const response = await client.send(listCommand);
    const users = response.Users || [];
    
    console.log(`Found ${users.length} users`);
    
    let fixedCount = 0;
    let alreadyVerifiedCount = 0;
    
    for (const user of users) {
      const email = user.Attributes?.find(attr => attr.Name === 'email')?.Value;
      const emailVerified = user.Attributes?.find(attr => attr.Name === 'email_verified')?.Value;
      const username = user.Username;
      const status = user.UserStatus;
      
      if (!email) {
        console.log(`⚠️  User ${username} has no email attribute`);
        continue;
      }
      
      if (emailVerified === 'false' && status === 'CONFIRMED') {
        console.log(`🔧 Fixing email verification for: ${email}`);
        
        try {
          const updateCommand = new AdminUpdateUserAttributesCommand({
            UserPoolId: USER_POOL_ID,
            Username: username,
            UserAttributes: [
              { Name: 'email_verified', Value: 'true' }
            ]
          });
          
          await client.send(updateCommand);
          console.log(`✅ Successfully verified email for: ${email}`);
          fixedCount++;
        } catch (error) {
          console.error(`❌ Failed to verify email for ${email}:`, error.message);
        }
      } else if (emailVerified === 'true') {
        console.log(`✓ Email already verified for: ${email}`);
        alreadyVerifiedCount++;
      } else if (status !== 'CONFIRMED') {
        console.log(`⏭️  Skipping unconfirmed user: ${email} (status: ${status})`);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`- Total users processed: ${users.length}`);
    console.log(`- Emails fixed: ${fixedCount}`);
    console.log(`- Already verified: ${alreadyVerifiedCount}`);
    console.log(`- Skipped: ${users.length - fixedCount - alreadyVerifiedCount}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Starting Cognito email verification fix...\n');
fixEmailVerification()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });