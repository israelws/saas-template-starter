'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  emailConfigAPI,
  EmailServiceProvider,
  EmailServiceConfig,
  getProviderDisplayName,
  GoogleWorkspaceConfig,
  Office365Config,
  SendGridConfig,
  TwilioConfig,
  SmtpConfig,
} from '@/lib/api/email-config';
import { Info, Eye, EyeOff } from 'lucide-react';

interface EmailServiceConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: EmailServiceProvider;
  config: EmailServiceConfig | null;
  organizationId: string;
  onSuccess: () => void;
}

// Provider-specific schemas
const googleWorkspaceSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
  refreshToken: z.string().min(1, 'Refresh Token is required'),
  fromEmail: z.string().email('Invalid email address'),
  fromName: z.string().optional(),
  domain: z.string().optional(),
});

const office365Schema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
  fromEmail: z.string().email('Invalid email address'),
  fromName: z.string().optional(),
  domain: z.string().optional(),
});

const sendGridSchema = z.object({
  apiKey: z.string().min(1, 'API Key is required'),
  fromEmail: z.string().email('Invalid email address'),
  fromName: z.string().optional(),
  invitationTemplateId: z.string().optional(),
  passwordResetTemplateId: z.string().optional(),
  welcomeTemplateId: z.string().optional(),
});

const twilioSchema = z.object({
  accountSid: z.string().min(1, 'Account SID is required'),
  authToken: z.string().min(1, 'Auth Token is required'),
  sendGridApiKey: z.string().optional(),
  fromEmail: z.string().email('Invalid email address'),
  fromName: z.string().optional(),
  messagingServiceSid: z.string().optional(),
});

const smtpSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1).max(65535, 'Port must be between 1 and 65535'),
  secure: z.boolean(),
  username: z.string().optional(),
  password: z.string().optional(),
  fromEmail: z.string().email('Invalid email address'),
  fromName: z.string().optional(),
  requireTls: z.boolean().optional(),
  ignoreTls: z.boolean().optional(),
  connectionTimeout: z.number().min(1000).max(60000).optional(),
  greetingTimeout: z.number().min(1000).max(60000).optional(),
  socketTimeout: z.number().min(1000).max(300000).optional(),
});

export function EmailServiceConfigDialog({
  open,
  onOpenChange,
  provider,
  config,
  organizationId,
  onSuccess,
}: EmailServiceConfigDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [enabled, setEnabled] = useState(config?.enabled ?? true);
  const [isDefault, setIsDefault] = useState(config?.isDefault ?? false);

  // Get the appropriate schema based on provider
  const getSchema = () => {
    switch (provider) {
      case 'google-workspace':
        return googleWorkspaceSchema;
      case 'office365':
        return office365Schema;
      case 'sendgrid':
        return sendGridSchema;
      case 'twilio':
        return twilioSchema;
      case 'smtp':
        return smtpSchema;
      default:
        return z.object({});
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: config?.config || {},
  });

  useEffect(() => {
    if (config) {
      form.reset(config.config);
      setEnabled(config.enabled);
      setIsDefault(config.isDefault);
    } else {
      form.reset({});
      setEnabled(true);
      setIsDefault(false);
    }
  }, [config, form]);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const payload = {
        provider,
        config: data,
        enabled,
        isDefault,
      };

      if (config) {
        await emailConfigAPI.update(organizationId, provider, {
          config: data,
          enabled,
          isDefault,
        });
        toast({
          title: 'Success',
          description: 'Email configuration updated successfully',
        });
      } else {
        await emailConfigAPI.create(organizationId, payload);
        toast({
          title: 'Success',
          description: 'Email configuration created successfully',
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderProviderFields = () => {
    switch (provider) {
      case 'google-workspace':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID *</Label>
              <Input
                id="clientId"
                {...form.register('clientId')}
                placeholder="Your Google OAuth2 Client ID"
              />
              {form.formState.errors.clientId && (
                <p className="text-sm text-red-500">{form.formState.errors.clientId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret *</Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showSecrets ? 'text' : 'password'}
                  {...form.register('clientSecret')}
                  placeholder="Your Google OAuth2 Client Secret"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {form.formState.errors.clientSecret && (
                <p className="text-sm text-red-500">{form.formState.errors.clientSecret.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="refreshToken">Refresh Token *</Label>
              <div className="relative">
                <Input
                  id="refreshToken"
                  type={showSecrets ? 'text' : 'password'}
                  {...form.register('refreshToken')}
                  placeholder="Your Google OAuth2 Refresh Token"
                />
              </div>
              {form.formState.errors.refreshToken && (
                <p className="text-sm text-red-500">{form.formState.errors.refreshToken.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email *</Label>
              <Input
                id="fromEmail"
                type="email"
                {...form.register('fromEmail')}
                placeholder="noreply@yourdomain.com"
              />
              {form.formState.errors.fromEmail && (
                <p className="text-sm text-red-500">{form.formState.errors.fromEmail.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                {...form.register('fromName')}
                placeholder="Your Organization"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Google Workspace Domain</Label>
              <Input
                id="domain"
                {...form.register('domain')}
                placeholder="yourdomain.com"
              />
            </div>
          </>
        );

      case 'office365':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant ID *</Label>
              <Input
                id="tenantId"
                {...form.register('tenantId')}
                placeholder="Your Azure AD Tenant ID"
              />
              {form.formState.errors.tenantId && (
                <p className="text-sm text-red-500">{form.formState.errors.tenantId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID *</Label>
              <Input
                id="clientId"
                {...form.register('clientId')}
                placeholder="Your Azure AD Application Client ID"
              />
              {form.formState.errors.clientId && (
                <p className="text-sm text-red-500">{form.formState.errors.clientId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret *</Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showSecrets ? 'text' : 'password'}
                  {...form.register('clientSecret')}
                  placeholder="Your Azure AD Application Client Secret"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {form.formState.errors.clientSecret && (
                <p className="text-sm text-red-500">{form.formState.errors.clientSecret.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email *</Label>
              <Input
                id="fromEmail"
                type="email"
                {...form.register('fromEmail')}
                placeholder="noreply@yourdomain.com"
              />
              {form.formState.errors.fromEmail && (
                <p className="text-sm text-red-500">{form.formState.errors.fromEmail.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                {...form.register('fromName')}
                placeholder="Your Organization"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Microsoft 365 Domain</Label>
              <Input
                id="domain"
                {...form.register('domain')}
                placeholder="yourdomain.com"
              />
            </div>
          </>
        );

      case 'sendgrid':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showSecrets ? 'text' : 'password'}
                  {...form.register('apiKey')}
                  placeholder="SG.xxxxxxxxxxxxxxxxxx"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {form.formState.errors.apiKey && (
                <p className="text-sm text-red-500">{form.formState.errors.apiKey.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email *</Label>
              <Input
                id="fromEmail"
                type="email"
                {...form.register('fromEmail')}
                placeholder="noreply@yourdomain.com"
              />
              {form.formState.errors.fromEmail && (
                <p className="text-sm text-red-500">{form.formState.errors.fromEmail.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                {...form.register('fromName')}
                placeholder="Your Organization"
              />
            </div>
          </>
        );

      case 'twilio':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="accountSid">Account SID *</Label>
              <Input
                id="accountSid"
                {...form.register('accountSid')}
                placeholder="ACxxxxxxxxxxxxxxxxxx"
              />
              {form.formState.errors.accountSid && (
                <p className="text-sm text-red-500">{form.formState.errors.accountSid.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="authToken">Auth Token *</Label>
              <div className="relative">
                <Input
                  id="authToken"
                  type={showSecrets ? 'text' : 'password'}
                  {...form.register('authToken')}
                  placeholder="Your Twilio Auth Token"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {form.formState.errors.authToken && (
                <p className="text-sm text-red-500">{form.formState.errors.authToken.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sendGridApiKey">SendGrid API Key (Recommended)</Label>
              <div className="relative">
                <Input
                  id="sendGridApiKey"
                  type={showSecrets ? 'text' : 'password'}
                  {...form.register('sendGridApiKey')}
                  placeholder="SG.xxxxxxxxxxxxxxxxxx"
                />
              </div>
              <p className="text-xs text-gray-500">
                Twilio owns SendGrid. Provide a SendGrid API key for email functionality.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email *</Label>
              <Input
                id="fromEmail"
                type="email"
                {...form.register('fromEmail')}
                placeholder="noreply@yourdomain.com"
              />
              {form.formState.errors.fromEmail && (
                <p className="text-sm text-red-500">{form.formState.errors.fromEmail.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                {...form.register('fromName')}
                placeholder="Your Organization"
              />
            </div>
          </>
        );

      case 'smtp':
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="host">SMTP Host *</Label>
                <Input
                  id="host"
                  {...form.register('host')}
                  placeholder="smtp.gmail.com"
                />
                {form.formState.errors.host && (
                  <p className="text-sm text-red-500">{form.formState.errors.host.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port *</Label>
                <Input
                  id="port"
                  type="number"
                  {...form.register('port', { valueAsNumber: true })}
                  placeholder="587"
                />
                {form.formState.errors.port && (
                  <p className="text-sm text-red-500">{form.formState.errors.port.message}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="secure"
                checked={form.watch('secure')}
                onCheckedChange={(checked) => form.setValue('secure', checked)}
              />
              <Label htmlFor="secure">Use SSL/TLS</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...form.register('username')}
                placeholder="your-email@gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showSecrets ? 'text' : 'password'}
                  {...form.register('password')}
                  placeholder="Your SMTP password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email *</Label>
              <Input
                id="fromEmail"
                type="email"
                {...form.register('fromEmail')}
                placeholder="noreply@yourdomain.com"
              />
              {form.formState.errors.fromEmail && (
                <p className="text-sm text-red-500">{form.formState.errors.fromEmail.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                {...form.register('fromName')}
                placeholder="Your Organization"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {config ? 'Edit' : 'Configure'} {getProviderDisplayName(provider)}
          </DialogTitle>
          <DialogDescription>
            Enter your {getProviderDisplayName(provider)} credentials and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="credentials">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="credentials" className="space-y-4 mt-4">
              {renderProviderFields()}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="enabled">Service Enabled</Label>
                  <p className="text-sm text-gray-500">
                    Enable this service to send emails
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="isDefault">Set as Default</Label>
                  <p className="text-sm text-gray-500">
                    Use this service as the default for sending emails
                  </p>
                </div>
                <Switch
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {provider === 'google-workspace' && (
                    <>
                      To use Google Workspace, you need to set up OAuth2 credentials in Google Cloud Console 
                      and obtain a refresh token with the Gmail API scope.
                    </>
                  )}
                  {provider === 'office365' && (
                    <>
                      To use Microsoft 365, register an application in Azure AD with Mail.Send permissions 
                      and create a client secret.
                    </>
                  )}
                  {provider === 'sendgrid' && (
                    <>
                      Create an API key in your SendGrid account with Mail Send permissions. 
                      Make sure your sender email is verified.
                    </>
                  )}
                  {provider === 'twilio' && (
                    <>
                      Twilio owns SendGrid. For email functionality, we recommend adding a SendGrid API key. 
                      You can find your Account SID and Auth Token in the Twilio Console.
                    </>
                  )}
                  {provider === 'smtp' && (
                    <>
                      Configure your SMTP server details. For Gmail, use smtp.gmail.com with port 587 (TLS) 
                      or 465 (SSL). You may need an app-specific password.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : config ? 'Update' : 'Create'} Configuration
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}