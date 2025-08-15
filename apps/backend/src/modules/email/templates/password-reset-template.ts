import { baseEmailTemplate, buttonStyles } from './base-template';

export interface PasswordResetEmailData {
  userName?: string;
  resetUrl: string;
  expiresIn?: string;
}

export const passwordResetEmailTemplate = (data: PasswordResetEmailData): string => {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 600;">
      Password Reset Request
    </h2>
    
    ${
      data.userName
        ? `
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5; color: #555555;">
      Hi ${data.userName},
    </p>
    `
        : ''
    }
    
    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5; color: #555555;">
      We received a request to reset your password. Click the button below to create a new password:
    </p>
    
    <!-- CTA Button -->
    <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0;">
      <tr>
        <td align="center" style="padding: 0 0 30px 0;">
          <a href="${data.resetUrl}" style="${buttonStyles}" target="_blank">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 6px; margin: 0 0 20px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0; font-size: 16px; color: #856404;">
        <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password won't be changed.
      </p>
    </div>
    
    ${
      data.expiresIn
        ? `
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #dc3545; font-style: italic;">
      This link will expire in ${data.expiresIn}.
    </p>
    `
        : ''
    }
    
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #666666;">
      If you're having trouble clicking the button, copy and paste the URL below into your web browser:
    </p>
    
    <p style="margin: 0; font-size: 12px; color: #999999; word-break: break-all;">
      ${data.resetUrl}
    </p>
  `;

  return baseEmailTemplate({
    subject: 'Password Reset Request',
    previewText: 'Reset your password',
    content,
  });
};
