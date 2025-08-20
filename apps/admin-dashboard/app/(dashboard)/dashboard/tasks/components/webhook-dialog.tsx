'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useToast } from '@/hooks/use-toast';
import { 
  tasksApi, 
  TaskLifecycleEvent, 
  LifecycleWebhook, 
  CreateWebhookDto,
  WebhookLog 
} from '@/lib/api/tasks';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Globe,
  Key,
  RefreshCw,
  Send,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Copy,
  TestTube,
  FileJson,
  Shield,
  Webhook,
} from 'lucide-react';
import { format } from 'date-fns';

interface WebhookDialogProps {
  lifecycleEvent: TaskLifecycleEvent;
  open: boolean;
  onClose: () => void;
}

interface WebhookFormData extends CreateWebhookDto {
  id?: string;
}

const AUTH_TYPES = [
  { value: 'none', label: 'No Authentication' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'api-key', label: 'API Key' },
  { value: 'custom', label: 'Custom Headers' },
];

const HTTP_METHODS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
];

export function WebhookDialog({ 
  lifecycleEvent, 
  open, 
  onClose 
}: WebhookDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('list');
  const [webhooks, setWebhooks] = useState<LifecycleWebhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<LifecycleWebhook | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<LifecycleWebhook | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [viewingLogs, setViewingLogs] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<WebhookFormData>({
    name: '',
    url: '',
    method: 'POST',
    headers: {},
    authType: undefined,
    authConfig: {},
    retryConfig: {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
    },
    isActive: true,
    includeContext: true,
    includeAuth: true,
    customPayload: {},
  });

  const [customHeaders, setCustomHeaders] = useState('');
  const [customPayload, setCustomPayload] = useState('');

  useEffect(() => {
    if (open) {
      loadWebhooks();
    }
  }, [open, lifecycleEvent.id]);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getWebhooks(lifecycleEvent.id);
      setWebhooks(data);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load webhooks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWebhookLogs = async (webhookId: string) => {
    try {
      const logs = await tasksApi.getWebhookLogs(lifecycleEvent.id, webhookId, 50);
      setWebhookLogs(logs);
      setViewingLogs(webhookId);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load webhook logs',
        variant: 'destructive',
      });
    }
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      url: '',
      method: 'POST',
      headers: {},
      authType: undefined,
      authConfig: {},
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
      isActive: true,
      includeContext: true,
      includeAuth: true,
      customPayload: {},
    });
    setCustomHeaders('');
    setCustomPayload('');
    setSelectedWebhook(null);
    setActiveTab('form');
  };

  const handleEdit = (webhook: LifecycleWebhook) => {
    setFormData({
      ...webhook,
      authType: webhook.authType || undefined,
    });
    setCustomHeaders(webhook.headers ? JSON.stringify(webhook.headers, null, 2) : '');
    setCustomPayload(webhook.customPayload ? JSON.stringify(webhook.customPayload, null, 2) : '');
    setSelectedWebhook(webhook);
    setActiveTab('form');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.url) {
      toast({
        title: 'Error',
        description: 'Please provide a name and URL for the webhook',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Parse custom headers and payload
      let headers = {};
      let customPayloadParsed = {};

      if (customHeaders.trim()) {
        try {
          headers = JSON.parse(customHeaders);
        } catch (e) {
          toast({
            title: 'Error',
            description: 'Invalid JSON in custom headers',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }
      }

      if (customPayload.trim()) {
        try {
          customPayloadParsed = JSON.parse(customPayload);
        } catch (e) {
          toast({
            title: 'Error',
            description: 'Invalid JSON in custom payload',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }
      }

      const dataToSave = {
        ...formData,
        headers,
        customPayload: customPayloadParsed,
        authType: formData.authType === 'none' ? undefined : formData.authType,
      };

      if (selectedWebhook) {
        await tasksApi.updateWebhook(lifecycleEvent.id, selectedWebhook.id, dataToSave);
        toast({
          title: 'Success',
          description: 'Webhook updated successfully',
        });
      } else {
        await tasksApi.createWebhook(lifecycleEvent.id, dataToSave);
        toast({
          title: 'Success',
          description: 'Webhook created successfully',
        });
      }
      
      loadWebhooks();
      setActiveTab('list');
    } catch (error) {
      toast({
        title: 'Error',
        description: selectedWebhook ? 'Failed to update webhook' : 'Failed to create webhook',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await tasksApi.deleteWebhook(lifecycleEvent.id, deleteConfirm.id);
      toast({
        title: 'Success',
        description: 'Webhook deleted successfully',
      });
      loadWebhooks();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete webhook',
        variant: 'destructive',
      });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleTest = async (webhook: LifecycleWebhook) => {
    setTesting(true);
    try {
      const result = await tasksApi.testWebhook(lifecycleEvent.id, webhook.id, {
        event: 'test',
        lifecycleEvent: {
          id: lifecycleEvent.id,
          name: lifecycleEvent.name,
        },
        timestamp: new Date().toISOString(),
        message: 'This is a test webhook from the admin dashboard',
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Webhook test successful',
        });
      } else {
        toast({
          title: 'Test Failed',
          description: result.error || 'Webhook test failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test webhook',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (isActive: boolean, lastStatus?: string) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (!lastStatus) {
      return <Badge variant="outline">Never Run</Badge>;
    }
    return lastStatus === 'success' 
      ? <Badge variant="default" className="bg-green-500">Active</Badge>
      : <Badge variant="destructive">Error</Badge>;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhooks for "{lifecycleEvent.name}"
            </DialogTitle>
            <DialogDescription>
              Configure webhooks that trigger when tasks transition to this lifecycle state
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list">
                Webhooks ({webhooks.length})
              </TabsTrigger>
              <TabsTrigger value="form" disabled={activeTab === 'list'}>
                {selectedWebhook ? 'Edit' : 'Create'}
              </TabsTrigger>
              <TabsTrigger value="logs" disabled={!viewingLogs}>
                Logs
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              <TabsContent value="list" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    {webhooks.length === 0 
                      ? 'No webhooks configured' 
                      : `${webhooks.filter(w => w.isActive).length} active, ${webhooks.filter(w => !w.isActive).length} inactive`}
                  </p>
                  <Button size="sm" onClick={handleAddNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Webhook
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-8">Loading webhooks...</div>
                ) : webhooks.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No webhooks configured</p>
                      <Button onClick={handleAddNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Webhook
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {webhooks.map((webhook) => (
                      <Card key={webhook.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusIcon(webhook.lastStatus)}
                                <h4 className="font-semibold">{webhook.name}</h4>
                                {getStatusBadge(webhook.isActive, webhook.lastStatus)}
                                <Badge variant="outline">{webhook.method}</Badge>
                                {webhook.authType && (
                                  <Badge variant="outline">
                                    <Shield className="mr-1 h-3 w-3" />
                                    {webhook.authType}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2 font-mono">
                                {webhook.url}
                              </p>
                              {webhook.lastTriggeredAt && (
                                <p className="text-xs text-muted-foreground">
                                  Last triggered: {format(new Date(webhook.lastTriggeredAt), 'PPp')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleTest(webhook)}
                                disabled={testing}
                                title="Test webhook"
                              >
                                <TestTube className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => loadWebhookLogs(webhook.id)}
                                title="View logs"
                              >
                                <Activity className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(webhook)}
                                title="Edit webhook"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeleteConfirm(webhook)}
                                className="hover:bg-destructive/10 hover:text-destructive"
                                title="Delete webhook"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="form" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="webhook-name">Name *</Label>
                    <Input
                      id="webhook-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Slack Notification"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="webhook-url">URL *</Label>
                    <Input
                      id="webhook-url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://hooks.example.com/webhook"
                      type="url"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>HTTP Method</Label>
                      <Select
                        value={formData.method}
                        onValueChange={(value: any) => setFormData({ ...formData, method: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HTTP_METHODS.map(method => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Authentication Type</Label>
                      <Select
                        value={formData.authType || 'none'}
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          authType: value === 'none' ? undefined : value as any,
                          authConfig: {}
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AUTH_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.authType === 'bearer' && (
                    <div className="grid gap-2">
                      <Label>Bearer Token</Label>
                      <div className="flex gap-2">
                        <Input
                          type={showSecrets ? 'text' : 'password'}
                          value={formData.authConfig?.token || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            authConfig: { ...formData.authConfig, token: e.target.value }
                          })}
                          placeholder="Enter bearer token"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => setShowSecrets(!showSecrets)}
                        >
                          {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  {formData.authType === 'basic' && (
                    <>
                      <div className="grid gap-2">
                        <Label>Username</Label>
                        <Input
                          value={formData.authConfig?.username || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            authConfig: { ...formData.authConfig, username: e.target.value }
                          })}
                          placeholder="Enter username"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Password</Label>
                        <Input
                          type={showSecrets ? 'text' : 'password'}
                          value={formData.authConfig?.password || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            authConfig: { ...formData.authConfig, password: e.target.value }
                          })}
                          placeholder="Enter password"
                        />
                      </div>
                    </>
                  )}

                  {formData.authType === 'api-key' && (
                    <>
                      <div className="grid gap-2">
                        <Label>API Key Header Name</Label>
                        <Input
                          value={formData.authConfig?.apiKeyHeader || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            authConfig: { ...formData.authConfig, apiKeyHeader: e.target.value }
                          })}
                          placeholder="e.g., X-API-Key"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>API Key Value</Label>
                        <Input
                          type={showSecrets ? 'text' : 'password'}
                          value={formData.authConfig?.apiKey || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            authConfig: { ...formData.authConfig, apiKey: e.target.value }
                          })}
                          placeholder="Enter API key"
                        />
                      </div>
                    </>
                  )}

                  <div className="grid gap-2">
                    <Label>Custom Headers (JSON)</Label>
                    <Textarea
                      value={customHeaders}
                      onChange={(e) => setCustomHeaders(e.target.value)}
                      placeholder={'{\n  "Content-Type": "application/json"\n}'}
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Custom Payload (JSON)</Label>
                    <Textarea
                      value={customPayload}
                      onChange={(e) => setCustomPayload(e.target.value)}
                      placeholder={'{\n  "channel": "#notifications"\n}'}
                      rows={3}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be merged with the event data
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Active</Label>
                        <p className="text-xs text-muted-foreground">
                          Webhook will only trigger when active
                        </p>
                      </div>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Include Task Context</Label>
                        <p className="text-xs text-muted-foreground">
                          Include full task details in webhook payload
                        </p>
                      </div>
                      <Switch
                        checked={formData.includeContext}
                        onCheckedChange={(checked) => setFormData({ ...formData, includeContext: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Include User Info</Label>
                        <p className="text-xs text-muted-foreground">
                          Include user authorization info in payload
                        </p>
                      </div>
                      <Switch
                        checked={formData.includeAuth}
                        onCheckedChange={(checked) => setFormData({ ...formData, includeAuth: checked })}
                      />
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Retry Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-xs">Max Retries</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={formData.retryConfig?.maxRetries || 3}
                          onChange={(e) => setFormData({
                            ...formData,
                            retryConfig: {
                              ...formData.retryConfig!,
                              maxRetries: parseInt(e.target.value)
                            }
                          })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs">Retry Delay (ms)</Label>
                        <Input
                          type="number"
                          min="100"
                          max="60000"
                          value={formData.retryConfig?.retryDelay || 1000}
                          onChange={(e) => setFormData({
                            ...formData,
                            retryConfig: {
                              ...formData.retryConfig!,
                              retryDelay: parseInt(e.target.value)
                            }
                          })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs">Backoff Multiplier</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          step="0.5"
                          value={formData.retryConfig?.backoffMultiplier || 2}
                          onChange={(e) => setFormData({
                            ...formData,
                            retryConfig: {
                              ...formData.retryConfig!,
                              backoffMultiplier: parseFloat(e.target.value)
                            }
                          })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('list')}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : selectedWebhook ? 'Update Webhook' : 'Create Webhook'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="logs" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Last 50 execution logs
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewingLogs && loadWebhookLogs(viewingLogs)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>

                {webhookLogs.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No execution logs found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {webhookLogs.map((log) => (
                      <Card key={log.id} className={log.success ? '' : 'border-red-200'}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {log.success ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm font-medium">
                                  {log.method} {log.responseStatus || 'Failed'}
                                </span>
                                {log.retryCount > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {log.retryCount} retries
                                  </Badge>
                                )}
                                {log.duration && (
                                  <span className="text-xs text-muted-foreground">
                                    {log.duration}ms
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground font-mono mb-1">
                                {log.url}
                              </p>
                              {log.error && (
                                <p className="text-xs text-red-600">
                                  Error: {log.error}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(log.createdAt), 'PPp')}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}