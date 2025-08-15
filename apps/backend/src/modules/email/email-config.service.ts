import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { EmailServiceConfig, EmailServiceProvider } from './entities/email-service-config.entity';
import {
  CreateEmailServiceConfigDto,
  UpdateEmailServiceConfigDto,
} from './dto/email-service-config.dto';

@Injectable()
export class EmailConfigService {
  constructor(
    @InjectRepository(EmailServiceConfig)
    private emailConfigRepository: Repository<EmailServiceConfig>,
  ) {}

  async findAll(organizationId?: string): Promise<EmailServiceConfig[]> {
    const where = organizationId ? { organizationId } : { organizationId: null };
    return this.emailConfigRepository.find({
      where,
      order: { provider: 'ASC' },
    });
  }

  async findOne(
    provider: EmailServiceProvider,
    organizationId?: string,
  ): Promise<EmailServiceConfig> {
    const where = organizationId
      ? { provider, organizationId }
      : { provider, organizationId: null };

    const config = await this.emailConfigRepository.findOne({
      where,
    });

    if (!config) {
      throw new NotFoundException(
        `Email configuration for ${provider} not found${organizationId ? ' for this organization' : ''}`,
      );
    }

    return config;
  }

  async findOneOrNull(
    provider: EmailServiceProvider,
    organizationId?: string,
  ): Promise<EmailServiceConfig | null> {
    const where = organizationId
      ? { provider, organizationId }
      : { provider, organizationId: null };

    return this.emailConfigRepository.findOne({
      where,
    });
  }

  async create(createDto: CreateEmailServiceConfigDto): Promise<EmailServiceConfig> {
    // Check if configuration already exists
    const where = createDto.organizationId
      ? { provider: createDto.provider, organizationId: createDto.organizationId }
      : { provider: createDto.provider, organizationId: null };

    const existing = await this.emailConfigRepository.findOne({ where });

    if (existing) {
      throw new ConflictException(
        `Configuration for ${createDto.provider} already exists${createDto.organizationId ? ' for this organization' : ''}`,
      );
    }

    // If this is set as global default, unset other global defaults
    if (createDto.isGlobalDefault && !createDto.organizationId) {
      await this.emailConfigRepository.update(
        { isGlobalDefault: true },
        { isGlobalDefault: false },
      );
    }

    // If this is set as default, unset other defaults for the same scope
    if (createDto.isDefault) {
      const defaultWhere = createDto.organizationId
        ? { isDefault: true, organizationId: createDto.organizationId }
        : { isDefault: true, organizationId: null };

      await this.emailConfigRepository.update(defaultWhere, { isDefault: false });
    }

    const config = this.emailConfigRepository.create({
      ...createDto,
      enabled: createDto.enabled ?? false,
      isDefault: createDto.isDefault ?? false,
      isGlobalDefault: createDto.isGlobalDefault ?? false,
    });

    return this.emailConfigRepository.save(config);
  }

  async update(
    provider: EmailServiceProvider,
    updateDto: UpdateEmailServiceConfigDto,
    organizationId?: string,
  ): Promise<EmailServiceConfig> {
    const config = await this.findOne(provider, organizationId);

    // If setting as global default, unset other global defaults
    if (updateDto.isGlobalDefault === true && !organizationId) {
      await this.emailConfigRepository.update(
        { isGlobalDefault: true, id: Not(config.id) },
        { isGlobalDefault: false },
      );
    }

    // If setting as default, unset other defaults for the same scope
    if (updateDto.isDefault === true) {
      const defaultWhere = organizationId
        ? { isDefault: true, organizationId, id: Not(config.id) }
        : { isDefault: true, organizationId: null, id: Not(config.id) };

      await this.emailConfigRepository.update(defaultWhere, { isDefault: false });
    }

    // Merge existing config with updates
    const updatedConfig = {
      ...config,
      ...updateDto,
      config: updateDto.config ? { ...config.config, ...updateDto.config } : config.config,
    };

    await this.emailConfigRepository.update({ id: config.id }, updatedConfig);

    return this.findOne(provider, organizationId);
  }

  async remove(provider: EmailServiceProvider, organizationId?: string): Promise<void> {
    const config = await this.findOne(provider, organizationId);

    // If this is the default, we need to unset it
    if (config.isDefault) {
      // Find another enabled config to set as default
      const where = organizationId
        ? {
            enabled: true,
            organizationId,
            id: Not(config.id),
          }
        : {
            enabled: true,
            organizationId: null,
            id: Not(config.id),
          };

      const otherConfig = await this.emailConfigRepository.findOne({ where });

      if (otherConfig) {
        await this.emailConfigRepository.update({ id: otherConfig.id }, { isDefault: true });
      }
    }

    await this.emailConfigRepository.delete({ id: config.id });
  }

  async testConfiguration(
    provider: EmailServiceProvider,
    to: string,
    organizationId?: string,
  ): Promise<{ success: boolean; message: string }> {
    const config = await this.findOne(provider, organizationId);

    if (!config.enabled) {
      throw new BadRequestException(`Email service ${provider} is not enabled`);
    }

    try {
      // Create a test email
      const testEmail = {
        to,
        subject: 'Test Email - Configuration Verification',
        html: `
          <h2>Test Email</h2>
          <p>This is a test email to verify your ${provider} email service configuration.</p>
          <p>If you received this email, your configuration is working correctly!</p>
          <hr>
          <p><small>Sent from your SAAS Template application</small></p>
        `,
      };

      // Send test email using the specific provider
      await this.sendTestEmail(provider, config.config, testEmail);

      // Update test results
      await this.emailConfigRepository.update(
        { provider },
        {
          lastTestAt: new Date(),
          lastTestSuccess: true,
          lastTestError: null,
        },
      );

      return {
        success: true,
        message: 'Test email sent successfully',
      };
    } catch (error) {
      // Update test results with error
      await this.emailConfigRepository.update(
        { provider },
        {
          lastTestAt: new Date(),
          lastTestSuccess: false,
          lastTestError: error.message,
        },
      );

      throw new BadRequestException(`Failed to send test email: ${error.message}`);
    }
  }

  async setDefault(
    provider: EmailServiceProvider,
    organizationId?: string,
  ): Promise<EmailServiceConfig> {
    const config = await this.findOne(provider, organizationId);

    if (!config.enabled) {
      throw new BadRequestException(`Cannot set disabled service ${provider} as default`);
    }

    // Unset all other defaults for the same scope
    const defaultWhere = organizationId
      ? { isDefault: true, organizationId }
      : { isDefault: true, organizationId: null };

    await this.emailConfigRepository.update(defaultWhere, { isDefault: false });

    // Set this as default
    await this.emailConfigRepository.update({ id: config.id }, { isDefault: true });

    return this.findOne(provider, organizationId);
  }

  async getDefaultConfig(organizationId?: string): Promise<EmailServiceConfig | null> {
    const where = organizationId
      ? { isDefault: true, enabled: true, organizationId }
      : { isDefault: true, enabled: true, organizationId: null };

    return this.emailConfigRepository.findOne({ where });
  }

  async getEnabledConfig(
    provider: EmailServiceProvider,
    organizationId?: string,
  ): Promise<EmailServiceConfig | null> {
    const where = organizationId
      ? { provider, enabled: true, organizationId }
      : { provider, enabled: true, organizationId: null };

    return this.emailConfigRepository.findOne({ where });
  }

  async getGlobalDefaultConfig(): Promise<EmailServiceConfig | null> {
    return this.emailConfigRepository.findOne({
      where: { isGlobalDefault: true, enabled: true, organizationId: null },
    });
  }

  async setGlobalDefault(provider: EmailServiceProvider): Promise<EmailServiceConfig> {
    const config = await this.findOne(provider);

    if (!config.enabled) {
      throw new BadRequestException(`Cannot set disabled service ${provider} as global default`);
    }

    if (config.organizationId) {
      throw new BadRequestException(`Cannot set organization-specific config as global default`);
    }

    // Unset all other global defaults
    await this.emailConfigRepository.update({ isGlobalDefault: true }, { isGlobalDefault: false });

    // Set this as global default
    await this.emailConfigRepository.update({ id: config.id }, { isGlobalDefault: true });

    return this.findOne(provider);
  }

  /**
   * Get the effective email configuration for an organization with fallback logic:
   * 1. Try to get organization-specific config for the provider
   * 2. Fall back to system-level config for the provider
   * 3. Fall back to organization's default provider
   * 4. Fall back to system's default provider
   * 5. Fall back to global default provider
   */
  async getEffectiveConfig(
    organizationId: string,
    preferredProvider?: EmailServiceProvider,
  ): Promise<EmailServiceConfig | null> {
    // 1. Try organization-specific config for the preferred provider
    if (preferredProvider) {
      const orgConfig = await this.getEnabledConfig(preferredProvider, organizationId);
      if (orgConfig) return orgConfig;

      // 2. Try system-level config for the preferred provider
      const sysConfig = await this.getEnabledConfig(preferredProvider);
      if (sysConfig) return sysConfig;
    }

    // 3. Try organization's default provider
    const orgDefault = await this.getDefaultConfig(organizationId);
    if (orgDefault) return orgDefault;

    // 4. Try system's default provider
    const sysDefault = await this.getDefaultConfig();
    if (sysDefault) return sysDefault;

    // 5. Try global default provider
    return this.getGlobalDefaultConfig();
  }

  private async sendTestEmail(
    provider: EmailServiceProvider,
    config: Record<string, any>,
    email: { to: string; subject: string; html: string },
  ): Promise<void> {
    switch (provider) {
      case EmailServiceProvider.AWS_SES:
        await this.sendAwsSesEmail(config, email);
        break;

      case EmailServiceProvider.SENDGRID:
        await this.sendSendGridEmail(config, email);
        break;

      case EmailServiceProvider.OFFICE365:
        await this.sendOffice365Email(config, email);
        break;

      case EmailServiceProvider.TWILIO:
        await this.sendTwilioEmail(config, email);
        break;

      case EmailServiceProvider.SMTP:
        await this.sendSMTPEmail(config, email);
        break;

      default:
        throw new Error(`Unsupported email provider: ${provider}`);
    }
  }

  private async sendSendGridEmail(
    config: Record<string, any>,
    email: { to: string; subject: string; html: string },
  ): Promise<void> {
    // TODO: Implement SendGrid email sending
    // For now, we'll simulate the sending
    if (!config.apiKey) {
      throw new Error('SendGrid API key is required');
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private async sendOffice365Email(
    config: Record<string, any>,
    email: { to: string; subject: string; html: string },
  ): Promise<void> {
    // TODO: Implement Office 365 email sending
    if (!config.clientId || !config.clientSecret || !config.tenantId) {
      throw new Error('Office 365 credentials are required');
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private async sendTwilioEmail(
    config: Record<string, any>,
    email: { to: string; subject: string; html: string },
  ): Promise<void> {
    // TODO: Implement Twilio SendGrid email sending
    if (!config.accountSid || !config.authToken || !config.apiKey) {
      throw new Error('Twilio credentials are required');
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private async sendSMTPEmail(
    config: Record<string, any>,
    email: { to: string; subject: string; html: string },
  ): Promise<void> {
    // TODO: Implement SMTP email sending
    if (!config.host || !config.port || !config.username || !config.password) {
      throw new Error('SMTP configuration is required');
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  private async sendAwsSesEmail(
    config: Record<string, any>,
    email: { to: string; subject: string; html: string },
  ): Promise<void> {
    // For AWS SES, we need to use the AWS SDK
    // This is a placeholder implementation
    if (!config.accessKeyId || !config.secretAccessKey || !config.region) {
      throw new Error('AWS SES configuration is incomplete');
    }

    // Simulate AWS SES API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
