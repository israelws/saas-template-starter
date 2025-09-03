# Email Troubleshooting Guide for Password Reset

## Current Status
✅ AWS Cognito IS sending emails successfully (confirmed via AWS CLI)
✅ Email verification is working
✅ The forgot password API is working

## Why You Might Not Be Receiving Emails

### 1. **Check Your SPAM/JUNK Folder** 🗑️
- Emails from Cognito come from: `no-reply@verificationemail.com`
- This sender often gets flagged as spam
- **CHECK YOUR SPAM FOLDER FIRST!**

### 2. **Email Address Format** 📧
- Emails with `+` symbols (like `israel+t21@committed.co.il`) might be filtered
- Some email providers block or delay these emails

### 3. **Cognito Default Limits** ⚠️
- Using `COGNITO_DEFAULT` has a **50 emails/day limit**
- Shared across ALL operations (signup, forgot password, etc.)
- The limit might already be exhausted

### 4. **Email Provider Blocking** 🚫
- Some corporate email servers block AWS verification emails
- Gmail, Outlook typically work better for testing

## How to Test Right Now

### Option 1: Check Backend Console Logs
When you request a password reset, the backend now logs:
```
=================================================
🔐 PASSWORD RESET CODE SENT
📧 Email: your-email@example.com
📍 Destination: y***@e***
📬 Delivery Method: EMAIL

⚠️  IMPORTANT: Check your email inbox AND spam folder!
📧 Sender: no-reply@verificationemail.com
=================================================
```

### Option 2: Use AWS CLI to Get Code
Unfortunately, Cognito doesn't expose the actual code via API for security reasons.

### Option 3: Test with Different Email
Try using a Gmail or Outlook email address for testing.

## Permanent Solution: Configure AWS SES

To fix this permanently, you need to configure AWS SES:

### Step 1: Verify Your Domain in SES
```bash
aws ses verify-domain-identity \
  --domain yourdomain.com \
  --region us-east-1
```

### Step 2: Update Cognito to Use SES
```bash
aws cognito-idp update-user-pool \
  --user-pool-id us-east-1_gWcQjDQN5 \
  --email-configuration \
    EmailSendingAccount=DEVELOPER \
    From="noreply@yourdomain.com" \
    SourceArn="arn:aws:ses:us-east-1:614679607310:identity/noreply@yourdomain.com" \
  --region us-east-1
```

### Step 3: Update Backend Environment
Add to `.env`:
```env
# AWS SES Configuration
AWS_ACCESS_KEY_ID=your-actual-key
AWS_SECRET_ACCESS_KEY=your-actual-secret
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

## Testing Checklist

- [ ] Check SPAM/JUNK folder
- [ ] Check backend console logs for confirmation
- [ ] Try with a Gmail address
- [ ] Verify you haven't hit the 50 email/day limit
- [ ] Wait 5-10 minutes (sometimes there's a delay)
- [ ] Check if email provider is blocking AWS emails

## Quick Test Command

Test directly with AWS CLI:
```bash
aws cognito-idp forgot-password \
  --client-id 2tb9odajr98utkavo5396lu6o6 \
  --username "your-email@example.com" \
  --region us-east-1
```

If this returns `"DeliveryMedium": "EMAIL"`, the email WAS sent by AWS.

## Still Not Working?

If you're still not receiving emails after checking everything above:

1. **The email IS being sent by AWS** (we confirmed this)
2. **Your email provider is likely blocking it**
3. **Configure AWS SES for reliable email delivery**

For development, you can temporarily create test users with known passwords to bypass email verification.