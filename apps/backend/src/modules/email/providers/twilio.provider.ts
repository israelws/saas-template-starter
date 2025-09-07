import { Injectable, Logger } from '@nestjs/common';
import * as SendGrid from '@sendgrid/mail';
import { IEmailService, SendEmailDto } from '../interfaces/email.interface';
import { TwilioConfigDto } from '../dto/provider-configs.dto';

@Injectable()
export class TwilioProvider implements IEmailService {
  private readonly logger = new Logger(TwilioProvider.name);
  private config: TwilioConfigDto;
  private useSendGrid: boolean;

  constructor(config: TwilioConfigDto) {
    this.config = config;
    
    // Twilio owns SendGrid, so we can use SendGrid API if provided
    this.useSendGrid = !!config.sendGridApiKey;
    
    if (this.useSendGrid) {
      SendGrid.setApiKey(config.sendGridApiKey);
    }
  }

  async sendEmail(dto: SendEmailDto): Promise<void> {
    if (this.useSendGrid) {
      return this.sendViaSendGrid(dto);
    } else {
      return this.sendViaTwilioEmail(dto);
    }
  }

  private async sendViaSendGrid(dto: SendEmailDto): Promise<void> {
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
      this.logger.log(`Email sent successfully via Twilio SendGrid to ${dto.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email via Twilio SendGrid: ${error.message}`, error.stack);
      
      // Extract more detailed error information from SendGrid response
      if (error.response && error.response.body) {
        const errors = error.response.body.errors;
        if (errors && errors.length > 0) {
          const errorMessages = errors.map(e => e.message).join(', ');
          throw new Error(`Failed to send email via Twilio SendGrid: ${errorMessages}`);
        }
      }
      
      throw new Error(`Failed to send email via Twilio SendGrid: ${error.message}`);
    }
  }

  private async sendViaTwilioEmail(dto: SendEmailDto): Promise<void> {
    try {
      // Note: Twilio's native email API is still in development
      // For now, we recommend using Twilio SendGrid for email functionality
      // This is a placeholder for when Twilio releases their native email API
      
      const fromEmail = dto.from || this.config.fromEmail;
      
      // In a real implementation, this would use Twilio's email API
      // For now, we'll throw an informative error
      throw new Error(
        'Twilio native email API is not yet available. ' +
        'Please configure a SendGrid API key in your Twilio configuration to send emails.'
      );
      
    } catch (error) {
      this.logger.error(`Failed to send email via Twilio: ${error.message}`, error.stack);
      throw new Error(`Failed to send email via Twilio: ${error.message}`);
    }
  }

  private normalizeRecipients(recipients?: string | string[]): string | string[] | undefined {
    if (!recipients) {
      return undefined;
    }
    return recipients;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (this.useSendGrid) {
        // Test SendGrid connection
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
          message: 'Successfully connected to Twilio SendGrid API',
        };
      } else {
        // For Twilio native email (when available)
        // This would test the Twilio email API connection
        return {
          success: false,
          message: 'Twilio native email API is not yet available. Please configure SendGrid API key.',
        };
      }
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
        message: `Failed to connect to Twilio: ${errorMessage}`,
      };
    }
  }

  // Additional method for sending SMS via Twilio (bonus feature)
  async sendSms(to: string, body: string): Promise<void> {
    if (!this.config.accountSid || !this.config.authToken || !this.config.messagingServiceSid) {
      throw new Error('Twilio SMS configuration is incomplete');
    }

    try {
      const twilio = require('twilio');
      const client = twilio(this.config.accountSid, this.config.authToken);

      await client.messages.create({
        body,
        to,
        messagingServiceSid: this.config.messagingServiceSid,
      });

      this.logger.log(`SMS sent successfully via Twilio to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS via Twilio: ${error.message}`, error.stack);
      throw new Error(`Failed to send SMS via Twilio: ${error.message}`);
    }
  }
}