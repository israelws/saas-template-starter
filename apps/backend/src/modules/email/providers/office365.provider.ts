import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { IEmailService, SendEmailDto } from '../interfaces/email.interface';
import { Office365ConfigDto } from '../dto/provider-configs.dto';

@Injectable()
export class Office365Provider implements IEmailService {
  private readonly logger = new Logger(Office365Provider.name);
  private graphClient: Client;
  private config: Office365ConfigDto;

  constructor(config: Office365ConfigDto) {
    this.config = config;
    this.initializeClient();
  }

  private initializeClient(): void {
    const credential = new ClientSecretCredential(
      this.config.tenantId,
      this.config.clientId,
      this.config.clientSecret,
    );

    this.graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken('https://graph.microsoft.com/.default');
          return token.token;
        },
      },
    });
  }

  async sendEmail(dto: SendEmailDto): Promise<void> {
    try {
      const fromEmail = dto.from || this.config.fromEmail;
      const fromName = this.config.fromName || 'No Reply';

      const message = {
        message: {
          subject: dto.subject,
          body: {
            contentType: dto.html ? 'HTML' : 'Text',
            content: dto.html || dto.text || '',
          },
          toRecipients: [
            {
              emailAddress: {
                address: dto.to,
              },
            },
          ],
          ccRecipients: this.formatRecipients(dto.cc),
          bccRecipients: this.formatRecipients(dto.bcc),
          from: {
            emailAddress: {
              address: fromEmail,
              name: fromName,
            },
          },
          replyTo: dto.replyTo ? [
            {
              emailAddress: {
                address: dto.replyTo,
              },
            },
          ] : undefined,
        },
        saveToSentItems: true,
      };

      // Send email using Microsoft Graph API
      await this.graphClient
        .api(`/users/${fromEmail}/sendMail`)
        .post(message);

      this.logger.log(`Email sent successfully via Office 365 to ${dto.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email via Office 365: ${error.message}`, error.stack);
      throw new Error(`Failed to send email via Office 365: ${error.message}`);
    }
  }

  private formatRecipients(recipients?: string | string[]): any[] | undefined {
    if (!recipients) {
      return undefined;
    }

    const recipientList = Array.isArray(recipients) ? recipients : [recipients];
    return recipientList.map(email => ({
      emailAddress: {
        address: email,
      },
    }));
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Try to get user profile to test the connection
      const user = await this.graphClient
        .api(`/users/${this.config.fromEmail}`)
        .select('displayName,mail,userPrincipalName')
        .get();

      return {
        success: true,
        message: `Successfully connected to Office 365 account: ${user.mail || user.userPrincipalName}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect to Office 365: ${error.message}`,
      };
    }
  }
}