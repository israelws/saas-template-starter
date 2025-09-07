import { apiClient } from '../api-client';

export type EmailServiceProvider = 
  | 'google-workspace'
  | 'office365'
  | 'sendgrid'
  | 'twilio'
  | 'aws-ses'
  | 'smtp';

export interface EmailServiceConfig {
  id: string;
  provider: EmailServiceProvider;
  organizationId?: string;
  config: Record<string, any>;
  enabled: boolean;
  isDefault: boolean;
  isGlobalDefault: boolean;
  lastTestAt?: Date;
  lastTestSuccess?: boolean;
  lastTestError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmailServiceConfigDto {
  provider: EmailServiceProvider;
  config: Record<string, any>;
  enabled: boolean;
  isDefault?: boolean;
}

export interface UpdateEmailServiceConfigDto {
  config?: Record<string, any>;
  enabled?: boolean;
  isDefault?: boolean;
}

export interface TestEmailServiceDto {
  to: string;
}

export const emailConfigAPI = {
  // Get all email service configurations for an organization
  async getAll(organizationId: string): Promise<EmailServiceConfig[]> {
    const response = await apiClient.get(`/organizations/${organizationId}/email-config`);
    return response.data;
  },

  // Get a specific email service configuration
  async getOne(organizationId: string, provider: EmailServiceProvider): Promise<EmailServiceConfig> {
    const response = await apiClient.get(`/organizations/${organizationId}/email-config/${provider}`);
    return response.data;
  },

  // Create or update an email service configuration
  async create(organizationId: string, data: CreateEmailServiceConfigDto): Promise<EmailServiceConfig> {
    const response = await apiClient.post(`/organizations/${organizationId}/email-config`, data);
    return response.data;
  },

  // Update an email service configuration
  async update(
    organizationId: string,
    provider: EmailServiceProvider,
    data: UpdateEmailServiceConfigDto
  ): Promise<EmailServiceConfig> {
    const response = await apiClient.put(
      `/organizations/${organizationId}/email-config/${provider}`,
      data
    );
    return response.data;
  },

  // Delete an email service configuration
  async delete(organizationId: string, provider: EmailServiceProvider): Promise<void> {
    await apiClient.delete(`/organizations/${organizationId}/email-config/${provider}`);
  },

  // Test an email service configuration
  async test(
    organizationId: string,
    provider: EmailServiceProvider,
    to: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(
      `/organizations/${organizationId}/email-config/${provider}/test`,
      { to }
    );
    return response.data;
  },

  // Set an email service as the default for the organization
  async setDefault(
    organizationId: string,
    provider: EmailServiceProvider
  ): Promise<EmailServiceConfig> {
    const response = await apiClient.post(
      `/organizations/${organizationId}/email-config/${provider}/set-default`
    );
    return response.data;
  },
};

// Provider-specific configuration interfaces for type safety
export interface GoogleWorkspaceConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  fromEmail: string;
  fromName?: string;
  domain?: string;
}

export interface Office365Config {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  fromEmail: string;
  fromName?: string;
  domain?: string;
}

export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
  invitationTemplateId?: string;
  passwordResetTemplateId?: string;
  welcomeTemplateId?: string;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  sendGridApiKey?: string;
  fromEmail: string;
  fromName?: string;
  messagingServiceSid?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username?: string;
  password?: string;
  fromEmail: string;
  fromName?: string;
  requireTls?: boolean;
  ignoreTls?: boolean;
  connectionTimeout?: number;
  greetingTimeout?: number;
  socketTimeout?: number;
}

export interface AwsSesConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  fromEmail: string;
  fromName?: string;
  configurationSet?: string;
}

// Helper function to get provider display name
export function getProviderDisplayName(provider: EmailServiceProvider): string {
  const displayNames: Record<EmailServiceProvider, string> = {
    'google-workspace': 'Google Workspace',
    'office365': 'Microsoft 365',
    'sendgrid': 'SendGrid',
    'twilio': 'Twilio',
    'aws-ses': 'AWS SES',
    'smtp': 'SMTP',
  };
  return displayNames[provider] || provider;
}

// Helper function to get provider icon
export function getProviderIcon(provider: EmailServiceProvider): string {
  const icons: Record<EmailServiceProvider, string> = {
    'google-workspace': '🔷',
    'office365': '📧',
    'sendgrid': '📨',
    'twilio': '💬',
    'aws-ses': '☁️',
    'smtp': '📮',
  };
  return icons[provider] || '📧';
}