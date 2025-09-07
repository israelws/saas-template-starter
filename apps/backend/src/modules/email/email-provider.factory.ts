import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailService } from './interfaces/email.interface';
import { EmailServiceProvider, EmailServiceConfig } from './entities/email-service-config.entity';
import { SesEmailService } from './ses-email.service';
import { GoogleWorkspaceProvider } from './providers/google-workspace.provider';
import { Office365Provider } from './providers/office365.provider';
import { SendGridProvider } from './providers/sendgrid.provider';
import { TwilioProvider } from './providers/twilio.provider';
import { SmtpProvider } from './providers/smtp.provider';
import {
  GoogleWorkspaceConfigDto,
  Office365ConfigDto,
  SendGridConfigDto,
  TwilioConfigDto,
  SmtpConfigDto,
  AwsSesConfigDto,
} from './dto/provider-configs.dto';

@Injectable()
export class EmailProviderFactory {
  constructor(private configService: ConfigService) {}

  createProvider(config: EmailServiceConfig): IEmailService {
    switch (config.provider) {
      case EmailServiceProvider.GOOGLE_WORKSPACE:
        return this.createGoogleWorkspaceProvider(config);
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

  private createGoogleWorkspaceProvider(config: EmailServiceConfig): IEmailService {
    const googleConfig = config.config as GoogleWorkspaceConfigDto;
    return new GoogleWorkspaceProvider(googleConfig);
  }

  private createAwsSesProvider(config: EmailServiceConfig): IEmailService {
    // Use the existing SES service with the provided config
    const sesConfig = config.config as AwsSesConfigDto;
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
    const sgConfig = config.config as SendGridConfigDto;
    return new SendGridProvider(sgConfig);
  }

  private createOffice365Provider(config: EmailServiceConfig): IEmailService {
    const o365Config = config.config as Office365ConfigDto;
    return new Office365Provider(o365Config);
  }

  private createTwilioProvider(config: EmailServiceConfig): IEmailService {
    const twilioConfig = config.config as TwilioConfigDto;
    return new TwilioProvider(twilioConfig);
  }

  private createSmtpProvider(config: EmailServiceConfig): IEmailService {
    const smtpConfig = config.config as SmtpConfigDto;
    return new SmtpProvider(smtpConfig);
  }
}
