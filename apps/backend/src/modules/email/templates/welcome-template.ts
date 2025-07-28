import { baseEmailTemplate, buttonStyles } from './base-template';

export interface WelcomeEmailData {
  userName: string;
  organizationName?: string;
  dashboardUrl: string;
  isSystemAdmin?: boolean;
}

export const welcomeEmailTemplate = (data: WelcomeEmailData): string => {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
      Welcome to SAAS Platform! 🎉
    </h2>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5; color: #555555;">
      Hi ${data.userName},
    </p>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5; color: #555555;">
      ${data.isSystemAdmin 
        ? `Congratulations! You've been granted <strong>System Administrator</strong> access to the SAAS Platform. You now have full control over the platform, including managing organizations, users, and system settings.`
        : data.organizationName 
          ? `Welcome to <strong>${data.organizationName}</strong>! Your account has been successfully created and you're ready to get started.`
          : `Welcome to SAAS Platform! Your account has been successfully created and you're ready to get started.`
      }
    </p>
    
    <!-- CTA Button -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0;">
      <tr>
        <td align="center" style="padding: 0 0 30px 0;">
          <a href="${data.dashboardUrl}" style="${buttonStyles}" target="_blank">
            Go to Dashboard
          </a>
        </td>
      </tr>
    </table>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 0 0 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px;">
        Getting Started
      </h3>
      ${data.isSystemAdmin ? `
      <ul style="margin: 0; padding-left: 20px; color: #555555;">
        <li style="margin-bottom: 8px;">Create and manage organizations</li>
        <li style="margin-bottom: 8px;">Configure system-wide settings</li>
        <li style="margin-bottom: 8px;">Set up email service integrations</li>
        <li style="margin-bottom: 8px;">Manage users and permissions</li>
        <li style="margin-bottom: 8px;">Monitor system performance and logs</li>
      </ul>
      ` : `
      <ul style="margin: 0; padding-left: 20px; color: #555555;">
        <li style="margin-bottom: 8px;">Complete your profile</li>
        <li style="margin-bottom: 8px;">Explore the dashboard</li>
        <li style="margin-bottom: 8px;">Check out the documentation</li>
        <li style="margin-bottom: 8px;">Invite team members</li>
      </ul>
      `}
    </div>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5; color: #555555;">
      If you have any questions or need assistance, don't hesitate to reach out to our support team.
    </p>
    
    <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #555555;">
      We're excited to have you on board!
    </p>
  `;
  
  return baseEmailTemplate({
    subject: data.isSystemAdmin 
      ? 'Welcome to SAAS Platform - System Administrator Access Granted' 
      : `Welcome to ${data.organizationName || 'SAAS Platform'}!`,
    previewText: 'Your account is ready',
    content
  });
};