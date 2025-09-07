import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { IEmailService, SendEmailDto } from '../interfaces/email.interface';
import { GoogleWorkspaceConfigDto } from '../dto/provider-configs.dto';

@Injectable()
export class GoogleWorkspaceProvider implements IEmailService {
  private readonly logger = new Logger(GoogleWorkspaceProvider.name);
  private oauth2Client: OAuth2Client;
  private gmail: any;
  private config: GoogleWorkspaceConfigDto;

  constructor(config: GoogleWorkspaceConfigDto) {
    this.config = config;
    this.initializeClient();
  }

  private initializeClient(): void {
    this.oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
    );

    this.oauth2Client.setCredentials({
      refresh_token: this.config.refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  async sendEmail(dto: SendEmailDto): Promise<void> {
    try {
      const fromEmail = dto.from || this.config.fromEmail;
      const fromName = this.config.fromName || 'No Reply';
      const from = `${fromName} <${fromEmail}>`;

      // Create email message
      const toAddress = Array.isArray(dto.to) ? dto.to.join(', ') : dto.to;
      const message = this.createMessage({
        to: toAddress,
        from,
        subject: dto.subject,
        html: dto.html,
        text: dto.text,
        cc: dto.cc,
        bcc: dto.bcc,
        replyTo: dto.replyTo,
      });

      // Send email using Gmail API
      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
        },
      });

      this.logger.log(`Email sent successfully via Google Workspace to ${dto.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email via Google Workspace: ${error.message}`, error.stack);
      throw new Error(`Failed to send email via Google Workspace: ${error.message}`);
    }
  }

  private createMessage(options: {
    to: string;
    from: string;
    subject: string;
    html?: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
  }): string {
    const boundary = '----=_Part_' + Date.now();
    const messageParts = [];

    // Headers
    messageParts.push(`To: ${options.to}`);
    messageParts.push(`From: ${options.from}`);
    messageParts.push(`Subject: ${options.subject}`);
    
    if (options.cc) {
      const ccAddresses = Array.isArray(options.cc) ? options.cc.join(', ') : options.cc;
      messageParts.push(`Cc: ${ccAddresses}`);
    }
    
    if (options.bcc) {
      const bccAddresses = Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc;
      messageParts.push(`Bcc: ${bccAddresses}`);
    }
    
    if (options.replyTo) {
      messageParts.push(`Reply-To: ${options.replyTo}`);
    }

    messageParts.push('MIME-Version: 1.0');

    // Handle multipart message if both text and HTML are provided
    if (options.html && options.text) {
      messageParts.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
      messageParts.push('');
      
      // Text part
      messageParts.push(`--${boundary}`);
      messageParts.push('Content-Type: text/plain; charset=utf-8');
      messageParts.push('Content-Transfer-Encoding: base64');
      messageParts.push('');
      messageParts.push(Buffer.from(options.text).toString('base64'));
      
      // HTML part
      messageParts.push(`--${boundary}`);
      messageParts.push('Content-Type: text/html; charset=utf-8');
      messageParts.push('Content-Transfer-Encoding: base64');
      messageParts.push('');
      messageParts.push(Buffer.from(options.html).toString('base64'));
      
      messageParts.push(`--${boundary}--`);
    } else if (options.html) {
      messageParts.push('Content-Type: text/html; charset=utf-8');
      messageParts.push('Content-Transfer-Encoding: base64');
      messageParts.push('');
      messageParts.push(Buffer.from(options.html).toString('base64'));
    } else if (options.text) {
      messageParts.push('Content-Type: text/plain; charset=utf-8');
      messageParts.push('Content-Transfer-Encoding: base64');
      messageParts.push('');
      messageParts.push(Buffer.from(options.text).toString('base64'));
    }

    const message = messageParts.join('\n');
    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Try to get user profile to test the connection
      const profile = await this.gmail.users.getProfile({ userId: 'me' });
      return {
        success: true,
        message: `Successfully connected to Google Workspace account: ${profile.data.emailAddress}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect to Google Workspace: ${error.message}`,
      };
    }
  }
}