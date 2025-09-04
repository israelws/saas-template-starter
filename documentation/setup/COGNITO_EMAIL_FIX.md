# Fix for Forgot Password Email Not Sending

## Problem
The forgot password functionality is not sending emails because AWS Cognito is using the default email configuration which has significant limitations.

## Current Configuration
- **Email Sending Account**: `COGNITO_DEFAULT`
- **User Pool ID**: `us-east-1_gWcQjDQN5`
- **Region**: `us-east-1`

## Limitations of COGNITO_DEFAULT
1. **Daily Email Limit**: Only 50 emails per day
2. **Sandbox Mode**: Can only send to verified email addresses
3. **From Address**: Uses `no-reply@verificationemail.com` (cannot customize)

## Solutions

### Solution 1: Quick Fix for Development (Recommended for Testing)
If you're testing with a specific email address:

1. **Verify your email address in AWS Cognito Console**:
   ```bash
   # Verify if your email is already confirmed in Cognito
   aws cognito-idp admin-get-user \
     --user-pool-id us-east-1_gWcQjDQN5 \
     --username your-email@example.com \
     --region us-east-1
   ```

2. **For new test users, ensure email is verified**:
   - Sign up with your test email
   - Complete email verification before testing forgot password

### Solution 2: Configure AWS SES for Production (Recommended)

1. **Set up AWS SES**:
   ```bash
   # Verify your domain in SES
   aws ses verify-domain-identity --domain yourdomain.com --region us-east-1
   
   # Or verify a single email address for testing
   aws ses verify-email-identity --email-address noreply@yourdomain.com --region us-east-1
   ```

2. **Update Cognito to use SES**:
   ```bash
   aws cognito-idp update-user-pool \
     --user-pool-id us-east-1_gWcQjDQN5 \
     --email-configuration \
       EmailSendingAccount=DEVELOPER,\
       From="noreply@yourdomain.com",\
       SourceArn="arn:aws:ses:us-east-1:YOUR_ACCOUNT_ID:identity/noreply@yourdomain.com" \
     --region us-east-1
   ```

3. **Update backend .env file** with SES credentials:
   ```env
   # AWS SES Configuration
   AWS_ACCESS_KEY_ID=your-actual-access-key
   AWS_SECRET_ACCESS_KEY=your-actual-secret-key
   EMAIL_FROM_ADDRESS=noreply@yourdomain.com
   ```

### Solution 3: Use Lambda Trigger for Custom Email (Advanced)

Create a custom Lambda function to handle email sending with any provider (SendGrid, Mailgun, etc.):

1. **Create Lambda function** for `CustomMessage` trigger
2. **Configure in Cognito User Pool**
3. **Implement custom email logic**

## Testing the Fix

After implementing one of the solutions above:

1. **Test with curl**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email": "your-verified-email@example.com"}'
   ```

2. **Check email inbox** (including spam folder)

3. **Monitor AWS CloudWatch** for any errors:
   ```bash
   aws logs tail /aws/cognito/userpools/us-east-1_gWcQjDQN5 --follow
   ```

## Immediate Workaround for Development

If you need to test the password reset flow without emails:

1. **Use AWS Console** to manually get the verification code:
   - Go to AWS Cognito Console
   - Navigate to your User Pool
   - Find the user
   - Check CloudWatch logs for the verification code

2. **Alternative: Create a development endpoint** to retrieve codes (NOT FOR PRODUCTION):
   ```typescript
   // Only for development - remove in production!
   @Post('dev/get-reset-code')
   async getResetCode(@Body() body: { email: string }) {
     if (process.env.NODE_ENV !== 'development') {
       throw new ForbiddenException();
     }
     // Implement logic to retrieve code from CloudWatch or database
   }
   ```

## Verification Steps

1. Check if emails are being sent:
   ```bash
   aws ses get-send-statistics --region us-east-1
   ```

2. Check Cognito User Pool metrics:
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/Cognito \
     --metric-name UserPoolEmailsSent \
     --dimensions Name=UserPool,Value=us-east-1_gWcQjDQN5 \
     --statistics Sum \
     --start-time 2024-01-01T00:00:00Z \
     --end-time 2024-12-31T23:59:59Z \
     --period 86400 \
     --region us-east-1
   ```

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "User does not exist" | Email not registered in Cognito |
| No email received | Check spam, verify email in SES/Cognito |
| "Message rejected" | SES not configured or in sandbox mode |
| Rate limit exceeded | Switch from COGNITO_DEFAULT to SES |

## Next Steps

1. For development: Use Solution 1 (verify test emails)
2. For production: Implement Solution 2 (configure SES)
3. Monitor email delivery in CloudWatch
4. Consider implementing email delivery webhooks for tracking