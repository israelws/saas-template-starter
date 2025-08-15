import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailService } from './interfaces/email.interface';
import { EmailServiceProvider, EmailServiceConfig } from './entities/email-service-config.entity';
import { SesEmailService } from './ses-email.service';

@Injectable()
export class EmailProviderFactory {
  constructor(private configService: ConfigService) {}

  createProvider(config: EmailServiceConfig): IEmailService {
    switch (config.provider) {
      case EmailServiceProvider.AWS_SES:
        return this.createAwsSesProvider(config);
      case EmailServiceProvider.SENDGRID:
        return this.createSendGridProvider(config);
      case EmailServiceProvider.OFFICE365:
        return this.createOffice365Provider(config);
      case EmailServiceProvider.TWILIO:
        return this.createTwilioProvider(config);
      case EmailServiceProvider.SMTP:
        return this.createSmtpProvider(config);
      default:
        throw new Error(`Unsupported email provider: ${config.provider}`);
    }
  }

  private createAwsSesProvider(config: EmailServiceConfig): IEmailService {
    // Use the existing SES service with the provided config
    const sesConfig = config.config as any;
    return new SesEmailService({
      get: (key: string) => {
        switch (key) {
          case 'aws.region':
            return sesConfig.region || this.configService.get('aws.region');
          case 'aws.accessKeyId':
            return sesConfig.accessKeyId || this.configService.get('aws.accessKeyId');
          case 'aws.secretAccessKey':
            return sesConfig.secretAccessKey || this.configService.get('aws.secretAccessKey');
          case 'email.fromAddress':
            return sesConfig.fromEmail || this.configService.get('email.fromAddress');
          case 'email.fromName':
            return sesConfig.fromName || this.configService.get('email.fromName');
          default:
            return this.configService.get(key);
        }
      },
    } as ConfigService);
  }

  private createSendGridProvider(config: EmailServiceConfig): IEmailService {
    // Placeholder for SendGrid implementation
    const sgConfig = config.config as any;
    return {
      async sendEmail(dto) {
        // This would use the SendGrid SDK in a real implementation
        console.log('Sending email via SendGrid', dto);
        // Mock implementation
        return Promise.resolve();
      },
    };
  }

  private createOffice365Provider(config: EmailServiceConfig): IEmailService {
    // Placeholder for Office 365 implementation
    const o365Config = config.config as any;
    return {
      async sendEmail(dto) {
        // This would use Microsoft Graph API in a real implementation
        console.log('Sending email via Office 365', dto);
        // Mock implementation
        return Promise.resolve();
      },
    };
  }

  private createTwilioProvider(config: EmailServiceConfig): IEmailService {
    // Placeholder for Twilio implementation
    const twilioConfig = config.config as any;
    return {
      async sendEmail(dto) {
        // This would use Twilio SendGrid API in a real implementation
        console.log('Sending email via Twilio', dto);
        // Mock implementation
        return Promise.resolve();
      },
    };
  }

  private createSmtpProvider(config: EmailServiceConfig): IEmailService {
    // Placeholder for SMTP implementation
    const smtpConfig = config.config as any;
    return {
      async sendEmail(dto) {
        // This would use nodemailer in a real implementation
        console.log('Sending email via SMTP', dto);
        // Mock implementation
        return Promise.resolve();
      },
    };
  }
}
