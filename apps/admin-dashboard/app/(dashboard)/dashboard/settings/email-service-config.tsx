'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Save, TestTube2 } from 'lucide-react';
import { EmailServiceType } from './email-service-integrations';
import { api } from '@/lib/api';

interface EmailServiceConfigProps {
  serviceType: EmailServiceType;
  organizationId?: string;
  onSave: () => void;
  onCancel: () => void;
}

interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'email' | 'number' | 'textarea' | 'switch';
  placeholder?: string;
  required?: boolean;
  description?: string;
}

const serviceConfigs: Record<EmailServiceType, ConfigField[]> = {
  office365: [
    { name: 'clientId', label: 'Client ID', type: 'text', required: true, placeholder: 'Your Office 365 Client ID' },
    { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'Your Office 365 Client Secret' },
    { name: 'tenantId', label: 'Tenant ID', type: 'text', required: true, placeholder: 'Your Office 365 Tenant ID' },
    { name: 'fromEmail', label: 'From Email', type: 'email', required: true, placeholder: 'noreply@yourdomain.com' },
    { name: 'fromName', label: 'From Name', type: 'text', placeholder: 'Your Company Name' },
    { name: 'enabled', label: 'Enable Service', type: 'switch', description: 'Enable this email service for sending emails' },
  ],
  sendgrid: [
    { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'Your SendGrid API Key' },
    { name: 'fromEmail', label: 'From Email', type: 'email', required: true, placeholder: 'noreply@yourdomain.com' },
    { name: 'fromName', label: 'From Name', type: 'text', placeholder: 'Your Company Name' },
    { name: 'replyTo', label: 'Reply To Email', type: 'email', placeholder: 'support@yourdomain.com' },
    { name: 'sandboxMode', label: 'Sandbox Mode', type: 'switch', description: 'Enable sandbox mode for testing' },
    { name: 'enabled', label: 'Enable Service', type: 'switch', description: 'Enable this email service for sending emails' },
  ],
  twilio: [
    { name: 'accountSid', label: 'Account SID', type: 'text', required: true, placeholder: 'Your Twilio Account SID' },
    { name: 'authToken', label: 'Auth Token', type: 'password', required: true, placeholder: 'Your Twilio Auth Token' },
    { name: 'apiKey', label: 'SendGrid API Key', type: 'password', required: true, placeholder: 'Your SendGrid API Key' },
    { name: 'fromEmail', label: 'From Email', type: 'email', required: true, placeholder: 'noreply@yourdomain.com' },
    { name: 'fromName', label: 'From Name', type: 'text', placeholder: 'Your Company Name' },
    { name: 'enabled', label: 'Enable Service', type: 'switch', description: 'Enable this email service for sending emails' },
  ],
  'aws-ses': [
    { name: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true, placeholder: 'Your AWS Access Key ID' },
    { name: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true, placeholder: 'Your AWS Secret Access Key' },
    { name: 'region', label: 'AWS Region', type: 'text', required: true, placeholder: 'us-east-1' },
    { name: 'fromEmail', label: 'From Email', type: 'email', required: true, placeholder: 'noreply@yourdomain.com' },
    { name: 'fromName', label: 'From Name', type: 'text', placeholder: 'Your Company Name' },
    { name: 'configurationSet', label: 'Configuration Set', type: 'text', placeholder: 'Optional SES Configuration Set' },
    { name: 'enabled', label: 'Enable Service', type: 'switch', description: 'Enable this email service for sending emails' },
  ],
  smtp: [
    { name: 'host', label: 'SMTP Host', type: 'text', required: true, placeholder: 'smtp.example.com' },
    { name: 'port', label: 'Port', type: 'number', required: true, placeholder: '587' },
    { name: 'secure', label: 'Use SSL/TLS', type: 'switch', description: 'Use secure connection (SSL/TLS)' },
    { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'your-smtp-username' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'your-smtp-password' },
    { name: 'fromEmail', label: 'From Email', type: 'email', required: true, placeholder: 'noreply@yourdomain.com' },
    { name: 'fromName', label: 'From Name', type: 'text', placeholder: 'Your Company Name' },
    { name: 'enabled', label: 'Enable Service', type: 'switch', description: 'Enable this email service for sending emails' },
  ],
};

const serviceNames: Record<EmailServiceType, string> = {
  office365: 'Office 365',
  sendgrid: 'SendGrid',
  twilio: 'Twilio SendGrid',
  'aws-ses': 'Amazon SES',
  smtp: 'SMTP Server',
};

export function EmailServiceConfig({ serviceType, organizationId, onSave, onCancel }: EmailServiceConfigProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const config = serviceConfigs[serviceType];
  const serviceName = serviceNames[serviceType];

  useEffect(() => {
    loadConfiguration();
  }, [serviceType]);

  const loadConfiguration = async () => {
    try {
      const url = organizationId 
        ? `/organizations/${organizationId}/email-config/${serviceType}`
        : `/email-config/${serviceType}`;
      const response = await api.get(url);
      if (response.status === 200) {
        const data = response.data;
        setFormData(data.config || {});
      }
    } catch (error) {
      // Configuration doesn't exist yet, that's ok
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      // First save the configuration
      const saveUrl = organizationId 
        ? `/organizations/${organizationId}/email-config`
        : `/email-config`;
      const saveResponse = await api.post(saveUrl, {
        provider: serviceType,
        config: formData,
        enabled: true,
      });

      if (saveResponse.status !== 200 && saveResponse.status !== 201) {
        const error = saveResponse.data;
        throw new Error(error.message || 'Failed to save configuration');
      }

      // Then test it
      const testUrl = organizationId
        ? `/organizations/${organizationId}/email-config/${serviceType}/test`
        : `/email-config/${serviceType}/test`;
      const testResponse = await api.post(testUrl, {
        to: formData.fromEmail || 'test@example.com',
      });

      if (testResponse.status !== 200 && testResponse.status !== 201) {
        const error = testResponse.data;
        throw new Error(error.message || 'Failed to send test email');
      }
      
      toast({
        title: 'Test Successful',
        description: 'Test email sent successfully. Check your inbox.',
      });
    } catch (error: any) {
      toast({
        title: 'Test Failed',
        description: error.message || 'Failed to send test email. Please check your configuration.',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    const missingFields = config
      .filter(field => field.required && !formData[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast({
        title: 'Validation Error',
        description: `Please fill in required fields: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const url = organizationId 
        ? `/organizations/${organizationId}/email-config`
        : `/email-config`;
      const response = await api.post(url, {
        provider: serviceType,
        config: formData,
        enabled: formData.enabled || false,
      });

      if (response.status !== 200 && response.status !== 201) {
        const error = response.data;
        throw new Error(error.message || 'Failed to save configuration');
      }
      
      toast({
        title: 'Configuration Saved',
        description: `${serviceName} configuration saved successfully.`,
      });
      
      onSave();
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save configuration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>{serviceName} Configuration</CardTitle>
            <CardDescription>Configure {serviceName} email service settings</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {config.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {field.type === 'switch' ? (
                <div className="flex items-center space-x-2">
                  <Switch
                    id={field.name}
                    checked={formData[field.name] || false}
                    onCheckedChange={(checked) => handleChange(field.name, checked)}
                  />
                  {field.description && (
                    <Label htmlFor={field.name} className="font-normal text-sm text-gray-600">
                      {field.description}
                    </Label>
                  )}
                </div>
              ) : field.type === 'textarea' ? (
                <Textarea
                  id={field.name}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              ) : (
                <Input
                  id={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}
              
              {field.description && field.type !== 'switch' && (
                <p className="text-sm text-gray-600">{field.description}</p>
              )}
            </div>
          ))}

          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={testing || saving}
            >
              <TestTube2 className="mr-2 h-4 w-4" />
              {testing ? 'Testing...' : 'Send Test Email'}
            </Button>
            
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}