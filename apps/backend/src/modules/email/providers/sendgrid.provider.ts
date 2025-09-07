import { Injectable, Logger } from '@nestjs/common';
import * as SendGrid from '@sendgrid/mail';
import { IEmailService, SendEmailDto } from '../interfaces/email.interface';
import { SendGridConfigDto } from '../dto/provider-configs.dto';

@Injectable()
export class SendGridProvider implements IEmailService {
  private readonly logger = new Logger(SendGridProvider.name);
  private config: SendGridConfigDto;

  constructor(config: SendGridConfigDto) {
    this.config = config;
    SendGrid.setApiKey(config.apiKey);
  }

  async sendEmail(dto: SendEmailDto): Promise<void> {
    try {
      const fromEmail = dto.from || this.config.fromEmail;
      const fromName = this.config.fromName || 'No Reply';

      const msg: SendGrid.MailDataRequired = {
        to: dto.to,
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject: dto.subject,
        text: dto.text,
        html: dto.html,
        cc: this.normalizeRecipients(dto.cc),
        bcc: this.normalizeRecipients(dto.bcc),
        replyTo: dto.replyTo ? { email: dto.replyTo } : undefined,
      };

      // Remove undefined fields
      Object.keys(msg).forEach(key => {
        if (msg[key] === undefined) {
          delete msg[key];
        }
      });

      await SendGrid.send(msg);
      this.logger.log(`Email sent successfully via SendGrid to ${dto.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email via SendGrid: ${error.message}`, error.stack);
      
      // Extract more detailed error information from SendGrid response
      if (error.response && error.response.body) {
        const errors = error.response.body.errors;
        if (errors && errors.length > 0) {
          const errorMessages = errors.map(e => e.message).join(', ');
          throw new Error(`Failed to send email via SendGrid: ${errorMessages}`);
        }
      }
      
      throw new Error(`Failed to send email via SendGrid: ${error.message}`);
    }
  }

  private normalizeRecipients(recipients?: string | string[]): string | string[] | undefined {
    if (!recipients) {
      return undefined;
    }
    return recipients;
  }

  async sendWithTemplate(dto: SendEmailDto & { templateId: string; dynamicTemplateData?: any }): Promise<void> {
    try {
      const fromEmail = dto.from || this.config.fromEmail;
      const fromName = this.config.fromName || 'No Reply';

      const msg: SendGrid.MailDataRequired = {
        to: dto.to,
        from: {
          email: fromEmail,
          name: fromName,
        },
        templateId: dto.templateId,
        dynamicTemplateData: dto.dynamicTemplateData || {},
        cc: this.normalizeRecipients(dto.cc),
        bcc: this.normalizeRecipients(dto.bcc),
        replyTo: dto.replyTo ? { email: dto.replyTo } : undefined,
      };

      // Remove undefined fields
      Object.keys(msg).forEach(key => {
        if (msg[key] === undefined) {
          delete msg[key];
        }
      });

      await SendGrid.send(msg);
      this.logger.log(`Template email sent successfully via SendGrid to ${dto.to}`);
    } catch (error) {
      this.logger.error(`Failed to send template email via SendGrid: ${error.message}`, error.stack);
      
      // Extract more detailed error information from SendGrid response
      if (error.response && error.response.body) {
        const errors = error.response.body.errors;
        if (errors && errors.length > 0) {
          const errorMessages = errors.map(e => e.message).join(', ');
          throw new Error(`Failed to send template email via SendGrid: ${errorMessages}`);
        }
      }
      
      throw new Error(`Failed to send template email via SendGrid: ${error.message}`);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // SendGrid doesn't have a specific test endpoint, so we'll try to send a test email
      // to a non-existent address and check if we get a proper API response
      const testMsg: SendGrid.MailDataRequired = {
        to: 'test@example.com',
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName || 'Test',
        },
        subject: 'Connection Test',
        text: 'This is a connection test',
        mailSettings: {
          sandboxMode: {
            enable: true, // This prevents the email from actually being sent
          },
        },
      };

      await SendGrid.send(testMsg);
      return {
        success: true,
        message: 'Successfully connected to SendGrid API',
      };
    } catch (error) {
      let errorMessage = error.message;
      
      if (error.response && error.response.body) {
        const errors = error.response.body.errors;
        if (errors && errors.length > 0) {
          errorMessage = errors.map(e => e.message).join(', ');
        }
      }
      
      return {
        success: false,
        message: `Failed to connect to SendGrid: ${errorMessage}`,
      };
    }
  }
}