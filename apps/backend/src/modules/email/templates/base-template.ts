export interface EmailTemplateData {
  subject: string;
  previewText?: string;
  content: string;
}

export const baseEmailTemplate = (data: EmailTemplateData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 10px !important; }
      .button { width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f9fc; color: #333333;">
  ${data.previewText ? `<div style="display: none; max-height: 0px; overflow: hidden;">${data.previewText}</div>` : ''}
  
  <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0; background-color: #f6f9fc;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table class="container" role="presentation" style="width: 600px; border-collapse: collapse; border: 0; border-spacing: 0; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px 30px 30px; text-align: center; background-color: #5e72e4; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                SAAS Template
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content" style="padding: 40px 30px;">
              ${data.content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0;">
                <tr>
                  <td style="text-align: center; color: #6c757d; font-size: 14px;">
                    <p style="margin: 0 0 10px 0;">
                      This email was sent by SAAS Template
                    </p>
                    <p style="margin: 0;">
                      © ${new Date().getFullYear()} SAAS Template. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const buttonStyles = `
  display: inline-block;
  padding: 14px 28px;
  background-color: #5e72e4;
  color: #ffffff !important;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 16px;
  text-align: center;
  transition: background-color 0.3s ease;
`;

export const secondaryButtonStyles = `
  display: inline-block;
  padding: 14px 28px;
  background-color: #ffffff;
  color: #5e72e4 !important;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 16px;
  text-align: center;
  border: 2px solid #5e72e4;
`;