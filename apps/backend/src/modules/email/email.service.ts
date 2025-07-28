import { Injectable, Inject } from '@nestjs/common';
import { IEmailService, SendEmailDto } from './interfaces/email.interface';
import { EmailConfigService } from './email-config.service';
import { EmailProviderFactory } from './email-provider.factory';
import { EmailServiceConfig } from './entities/email-service-config.entity';
import { 
  invitationEmailTemplate, 
  InvitationEmailData,
  invitationAcceptedEmailTemplate,
  passwordResetEmailTemplate,
  PasswordResetEmailData,
  welcomeEmailTemplate,
  WelcomeEmailData,
} from './templates';

@Injectable()
export class EmailService {
  constructor(
    @Inject('EMAIL_SERVICE')
    private readonly defaultEmailProvider: IEmailService,
    private readonly emailConfigService: EmailConfigService,
    private readonly emailProviderFactory: EmailProviderFactory,
  ) {}

  async sendEmail(dto: SendEmailDto, organizationId?: string): Promise<void> {
    // Get the effective email configuration for the organization
    if (organizationId) {
      const effectiveConfig = await this.emailConfigService.getEffectiveConfig(organizationId);
      if (effectiveConfig) {
        // Use the configured provider for this organization
        return this.sendEmailWithConfig(dto, effectiveConfig);
      }
    }
    
    // Check for system default configuration
    const defaultConfig = await this.emailConfigService.getDefaultConfig();
    if (defaultConfig) {
      return this.sendEmailWithConfig(dto, defaultConfig);
    }
    
    // Fall back to default AWS SES provider
    return this.defaultEmailProvider.sendEmail(dto);
  }

  private async sendEmailWithConfig(dto: SendEmailDto, config: EmailServiceConfig): Promise<void> {
    // Create a provider instance based on the configuration
    const provider = this.emailProviderFactory.createProvider(config);
    
    // Apply any config-specific overrides to the DTO
    const enhancedDto = {
      ...dto,
      from: config.config.fromEmail || dto.from,
    };
    
    // Send the email using the configured provider
    return provider.sendEmail(enhancedDto);
  }

  async sendInvitationEmail(
    to: string,
    data: InvitationEmailData,
    organizationId?: string,
  ): Promise<void> {
    const html = invitationEmailTemplate(data);
    const subject = `Invitation to join ${data.organizationName}`;

    return this.sendEmail({
      to,
      subject,
      html,
    }, organizationId);
  }

  async sendInvitationAcceptedEmail(
    to: string,
    data: {
      inviterName: string;
      acceptedByName: string;
      acceptedByEmail: string;
      organizationName: string;
      role: string;
    },
    organizationId?: string,
  ): Promise<void> {
    const html = invitationAcceptedEmailTemplate(data);
    const subject = `${data.acceptedByName} accepted your invitation`;

    return this.sendEmail({
      to,
      subject,
      html,
    }, organizationId);
  }

  async sendPasswordResetEmail(
    to: string,
    data: PasswordResetEmailData,
  ): Promise<void> {
    const html = passwordResetEmailTemplate(data);
    const subject = 'Password Reset Request';

    return this.sendEmail({
      to,
      subject,
      html,
    });
  }

  async sendWelcomeEmail(
    to: string,
    data: WelcomeEmailData,
    organizationId?: string,
  ): Promise<void> {
    const html = welcomeEmailTemplate(data);
    const subject = data.isSystemAdmin 
      ? 'Welcome to SAAS Platform - System Administrator Access Granted' 
      : `Welcome to ${data.organizationName || 'SAAS Platform'}!`;

    return this.sendEmail({
      to,
      subject,
      html,
    }, organizationId);
  }
}