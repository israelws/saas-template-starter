'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';
import {
  ArrowLeft,
  Mail,
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  TestTube,
  Star,
  RefreshCw,
} from 'lucide-react';
import {
  emailConfigAPI,
  EmailServiceConfig,
  EmailServiceProvider,
  getProviderDisplayName,
  getProviderIcon,
} from '@/lib/api/email-config';
import { organizationAPI } from '@/lib/api';
import { EmailServiceConfigDialog } from '@/components/email/email-service-config-dialog';
import { EmailTestDialog } from '@/components/email/email-test-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function OrganizationEmailConfigPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [configs, setConfigs] = useState<EmailServiceConfig[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  
  // Dialog states
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<EmailServiceConfig | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<EmailServiceProvider | null>(null);
  const [configToDelete, setConfigToDelete] = useState<EmailServiceConfig | null>(null);

  useBreadcrumb([
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Organizations', href: '/dashboard/organizations' },
    { label: organization?.name || 'Loading...', href: `/dashboard/organizations/${params.id}` },
    { label: 'Email Configuration', icon: <Mail className="h-4 w-4" /> },
  ]);

  const fetchEmailConfigs = useCallback(async () => {
    try {
      const [orgResponse, configsResponse] = await Promise.all([
        organizationAPI.getById(params.id as string),
        emailConfigAPI.getAll(params.id as string),
      ]);
      
      setOrganization(orgResponse.data);
      setConfigs(configsResponse);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch email configurations',
        variant: 'destructive',
      });
    } finally {
      setIsFetching(false);
    }
  }, [params.id, toast]);

  useEffect(() => {
    if (params.id) {
      fetchEmailConfigs();
    }
  }, [params.id, fetchEmailConfigs]);

  const handleAddConfig = (provider: EmailServiceProvider) => {
    setSelectedProvider(provider);
    setSelectedConfig(null);
    setConfigDialogOpen(true);
  };

  const handleEditConfig = (config: EmailServiceConfig) => {
    setSelectedConfig(config);
    setSelectedProvider(config.provider);
    setConfigDialogOpen(true);
  };

  const handleTestConfig = (config: EmailServiceConfig) => {
    setSelectedConfig(config);
    setTestDialogOpen(true);
  };

  const handleDeleteConfig = (config: EmailServiceConfig) => {
    setConfigToDelete(config);
    setDeleteDialogOpen(true);
  };

  const handleSetDefault = async (config: EmailServiceConfig) => {
    setIsLoading(true);
    try {
      await emailConfigAPI.setDefault(params.id as string, config.provider);
      toast({
        title: 'Success',
        description: `${getProviderDisplayName(config.provider)} set as default email service`,
      });
      await fetchEmailConfigs();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to set default email service',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!configToDelete) return;
    
    setIsLoading(true);
    try {
      await emailConfigAPI.delete(params.id as string, configToDelete.provider);
      toast({
        title: 'Success',
        description: `${getProviderDisplayName(configToDelete.provider)} configuration deleted`,
      });
      await fetchEmailConfigs();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
    }
  };

  const availableProviders: EmailServiceProvider[] = [
    'google-workspace',
    'office365',
    'sendgrid',
    'twilio',
    'smtp',
  ];

  const configuredProviders = configs.map(c => c.provider);
  const unconfiguredProviders = availableProviders.filter(p => !configuredProviders.includes(p));

  if (isFetching) {
    return <div className="py-10 text-center">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/organizations/${params.id}/settings`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Email Service Configuration</h1>
        <p className="text-gray-500">
          Configure email services for {organization?.name}. Set up multiple providers and choose a default.
        </p>
      </div>

      {/* Configured Services */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Configured Services</h2>
        {configs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No email services configured yet</p>
              <p className="text-sm text-gray-400">
                Add an email service below to start sending invitations and notifications
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {configs.map((config) => (
              <Card key={config.id} className={config.isDefault ? 'ring-2 ring-blue-500' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-2xl">{getProviderIcon(config.provider)}</span>
                      {getProviderDisplayName(config.provider)}
                    </CardTitle>
                    {config.isDefault && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Default
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      {config.enabled ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Disabled
                        </Badge>
                      )}
                    </div>
                    {config.lastTestAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Last Test:</span>
                        {config.lastTestSuccess ? (
                          <Badge variant="success" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Passed
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </div>
                    )}
                    {config.config.fromEmail && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">From:</span>
                        <span className="text-sm truncate">{config.config.fromEmail}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditConfig(config)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestConfig(config)}
                    >
                      <TestTube className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteConfig(config)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {!config.isDefault && config.enabled && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSetDefault(config)}
                    >
                      Set Default
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add New Service */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Add Email Service</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {unconfiguredProviders.map((provider) => (
            <Card
              key={provider}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleAddConfig(provider)}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-2xl">{getProviderIcon(provider)}</span>
                  {getProviderDisplayName(provider)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Click to configure {getProviderDisplayName(provider)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Configuration Dialog */}
      {selectedProvider && (
        <EmailServiceConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          provider={selectedProvider}
          config={selectedConfig}
          organizationId={params.id as string}
          onSuccess={fetchEmailConfigs}
        />
      )}

      {/* Test Dialog */}
      {selectedConfig && (
        <EmailTestDialog
          open={testDialogOpen}
          onOpenChange={setTestDialogOpen}
          config={selectedConfig}
          organizationId={params.id as string}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the {configToDelete && getProviderDisplayName(configToDelete.provider)} configuration?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}