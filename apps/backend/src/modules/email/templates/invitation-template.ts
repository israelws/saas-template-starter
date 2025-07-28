import { baseEmailTemplate, buttonStyles } from './base-template';

export interface InvitationEmailData {
  recipientName?: string;
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  role: string;
  invitationUrl: string;
  expiresIn?: string;
}

export const invitationEmailTemplate = (data: InvitationEmailData): string => {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
      You're invited to join ${data.organizationName}
    </h2>
    
    ${data.recipientName ? `
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5; color: #555555;">
      Hi ${data.recipientName},
    </p>
    ` : ''}
    
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5; color: #555555;">
      <strong>${data.inviterName}</strong> (${data.inviterEmail}) has invited you to join <strong>${data.organizationName}</strong> as a <strong>${data.role}</strong>.
    </p>
    
    <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.5; color: #555555;">
      Click the button below to accept this invitation and set up your account:
    </p>
    
    <!-- CTA Button -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0;">
      <tr>
        <td align="center" style="padding: 0 0 30px 0;">
          <a href="${data.invitationUrl}" style="${buttonStyles}" target="_blank">
            Accept Invitation
          </a>
        </td>
      </tr>
    </table>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 0 0 20px 0;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">
        <strong>Organization:</strong> ${data.organizationName}
      </p>
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">
        <strong>Your Role:</strong> ${data.role}
      </p>
      <p style="margin: 0; font-size: 14px; color: #666666;">
        <strong>Invited by:</strong> ${data.inviterName}
      </p>
    </div>
    
    ${data.expiresIn ? `
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #dc3545; font-style: italic;">
      ⚠️ This invitation will expire in ${data.expiresIn}.
    </p>
    ` : ''}
    
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #666666;">
      If you're having trouble clicking the button, copy and paste the URL below into your web browser:
    </p>
    
    <p style="margin: 0; font-size: 12px; color: #999999; word-break: break-all;">
      ${data.invitationUrl}
    </p>
  `;
  
  return baseEmailTemplate({
    subject: `Invitation to join ${data.organizationName}`,
    previewText: `${data.inviterName} has invited you to join ${data.organizationName} as a ${data.role}`,
    content
  });
};

export const invitationAcceptedEmailTemplate = (data: {
  inviterName: string;
  acceptedByName: string;
  acceptedByEmail: string;
  organizationName: string;
  role: string;
}): string => {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
      Invitation Accepted! 🎉
    </h2>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5; color: #555555;">
      Hi ${data.inviterName},
    </p>
    
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5; color: #555555;">
      Great news! <strong>${data.acceptedByName}</strong> (${data.acceptedByEmail}) has accepted your invitation to join <strong>${data.organizationName}</strong> as a <strong>${data.role}</strong>.
    </p>
    
    <div style="background-color: #d4edda; padding: 20px; border-radius: 6px; margin: 0 0 20px 0; border-left: 4px solid #28a745;">
      <p style="margin: 0; font-size: 16px; color: #155724;">
        <strong>✓ ${data.acceptedByName}</strong> is now a member of your organization and can access the platform.
      </p>
    </div>
    
    <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #555555;">
      You can manage their permissions and access from the organization settings page.
    </p>
  `;
  
  return baseEmailTemplate({
    subject: `${data.acceptedByName} accepted your invitation`,
    previewText: `${data.acceptedByName} has joined ${data.organizationName} as a ${data.role}`,
    content
  });
};

export const invitationReminderEmailTemplate = (data: InvitationEmailData & { 
  daysRemaining: number;
}): string => {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
      Reminder: You have a pending invitation
    </h2>
    
    ${data.recipientName ? `
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5; color: #555555;">
      Hi ${data.recipientName},
    </p>
    ` : ''}
    
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5; color: #555555;">
      This is a friendly reminder that you have a pending invitation from <strong>${data.inviterName}</strong> to join <strong>${data.organizationName}</strong>.
    </p>
    
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; margin: 0 0 30px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0; font-size: 16px; color: #856404;">
        ⏰ Your invitation expires in <strong>${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''}</strong>
      </p>
    </div>
    
    <!-- CTA Button -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0;">
      <tr>
        <td align="center" style="padding: 0 0 30px 0;">
          <a href="${data.invitationUrl}" style="${buttonStyles}" target="_blank">
            Accept Invitation Now
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #666666;">
      Don't miss out on joining ${data.organizationName}!
    </p>
  `;
  
  return baseEmailTemplate({
    subject: `Reminder: Your invitation to ${data.organizationName} expires soon`,
    previewText: `Your invitation expires in ${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''}`,
    content
  });
};