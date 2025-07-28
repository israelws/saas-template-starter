'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { EmailServiceConfig } from './email-service-config';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { 
  MicrosoftIcon, 
  SendGridIcon, 
  TwilioIcon, 
  AwsIcon, 
  SmtpIcon 
} from '@/components/icons/email-providers';

export type EmailServiceType = 'office365' | 'sendgrid' | 'twilio' | 'aws-ses' | 'smtp';

interface EmailService {
  id: EmailServiceType;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  configured?: boolean;
}

const emailServices: EmailService[] = [
  {
    id: 'office365',
    name: 'Office 365',
    description: 'Microsoft Office 365 mail service',
    icon: MicrosoftIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'SendGrid email delivery platform',
    icon: SendGridIcon,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'twilio',
    name: 'Twilio SendGrid',
    description: 'Twilio SendGrid email API',
    icon: TwilioIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    id: 'aws-ses',
    name: 'Amazon SES',
    description: 'AWS Simple Email Service',
    icon: AwsIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'smtp',
    name: 'SMTP Server',
    description: 'Custom SMTP server configuration',
    icon: SmtpIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
];

interface EmailServiceIntegrationsProps {
  organizationId?: string;
  isSystemLevel?: boolean;
}

export function EmailServiceIntegrations({ organizationId, isSystemLevel = false }: EmailServiceIntegrationsProps) {
  const [selectedService, setSelectedService] = useState<EmailServiceType | null>(null);
  const [configuredServices, setConfiguredServices] = useState<Set<EmailServiceType>>(new Set());
  const [systemConfiguredServices, setSystemConfiguredServices] = useState<Set<EmailServiceType>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmailConfigurations();
  }, [organizationId]);

  const fetchEmailConfigurations = async () => {
    try {
      const url = organizationId 
        ? `/organizations/${organizationId}/email-config`
        : '/email-config';
      const response = await api.get(url);
      if (response.status === 200) {
        const configs = response.data;
        const configuredIds = new Set(configs.map((config: any) => config.provider)) as Set<EmailServiceType>;
        setConfiguredServices(configuredIds);
      }

      // If we're viewing organization-level configs, also fetch system configs to show inheritance
      if (organizationId) {
        try {
          const systemResponse = await api.get('/email-config');
          if (systemResponse.status === 200) {
            const systemConfigs = systemResponse.data;
            const systemConfiguredIds = new Set(systemConfigs.map((config: any) => config.provider)) as Set<EmailServiceType>;
            setSystemConfiguredServices(systemConfiguredIds);
          }
        } catch (error) {
          // It's ok if this fails, it just means no system configs
          console.log('Could not fetch system configs:', error);
        }
      }
    } catch (error: any) {
      console.error('Failed to load email configurations:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load email configurations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (serviceId: EmailServiceType) => {
    setSelectedService(serviceId);
  };

  const handleConfigSave = async (serviceId: EmailServiceType) => {
    await fetchEmailConfigurations();
    setSelectedService(null);
  };

  const handleConfigCancel = () => {
    setSelectedService(null);
  };

  if (selectedService) {
    return (
      <EmailServiceConfig
        serviceType={selectedService}
        organizationId={organizationId}
        onSave={() => handleConfigSave(selectedService)}
        onCancel={handleConfigCancel}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Service Integrations</CardTitle>
        <CardDescription>
          {isSystemLevel 
            ? 'Configure system-wide email service providers. These will be used as defaults for all organizations.'
            : 'Configure email service providers for your organization. These will override system defaults.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emailServices.map((service) => {
            const Icon = service.icon;
            const isConfigured = configuredServices.has(service.id);
            const hasSystemConfig = systemConfiguredServices.has(service.id);
            
            return (
              <div
                key={service.id}
                className={cn(
                  "relative p-6 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md",
                  isConfigured 
                    ? "border-green-500 bg-green-50/50" 
                    : hasSystemConfig && organizationId
                    ? "border-blue-300 bg-blue-50/30"
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => handleServiceClick(service.id)}
              >
                {isConfigured && (
                  <Badge 
                    variant="outline" 
                    className="absolute top-2 right-2 border-green-500 text-green-600"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Configured
                  </Badge>
                )}
                {!isConfigured && hasSystemConfig && organizationId && (
                  <Badge 
                    variant="outline" 
                    className="absolute top-2 right-2 border-blue-400 text-blue-600"
                  >
                    Using System Default
                  </Badge>
                )}
                
                <div className={cn("p-3 rounded-lg inline-flex mb-4", service.bgColor)}>
                  <Icon className={cn("h-8 w-8", service.color)} />
                </div>
                
                <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                <p className="text-sm text-gray-600">{service.description}</p>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleServiceClick(service.id);
                  }}
                >
                  {isConfigured ? 'Edit Configuration' : 'Configure'}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}