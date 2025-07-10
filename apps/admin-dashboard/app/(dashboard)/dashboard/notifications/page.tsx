'use client';

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Mail,
  MessageSquare,
  Shield,
  Users,
  Building2,
  Check,
  Archive,
  Settings,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: 'security' | 'policy' | 'organization' | 'user' | 'system';
  title: string;
  message: string;
  read: boolean;
  urgent: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

interface NotificationPreferences {
  email: {
    security: boolean;
    policy: boolean;
    organization: boolean;
    user: boolean;
    system: boolean;
  };
  inApp: {
    security: boolean;
    policy: boolean;
    organization: boolean;
    user: boolean;
    system: boolean;
  };
  digest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
  };
}

const NOTIFICATION_TYPES = {
  security: { label: 'Security', icon: Shield, color: 'text-red-600' },
  policy: { label: 'Policy', icon: Shield, color: 'text-blue-600' },
  organization: { label: 'Organization', icon: Building2, color: 'text-green-600' },
  user: { label: 'User', icon: Users, color: 'text-purple-600' },
  system: { label: 'System', icon: Bell, color: 'text-gray-600' },
};

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'security',
    title: 'Security Alert',
    message: 'Unusual login activity detected from new device',
    read: false,
    urgent: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    actionUrl: '/dashboard/settings/security',
    actionText: 'Review Security',
  },
  {
    id: '2',
    type: 'policy',
    title: 'Policy Updated',
    message: 'User access policy has been modified',
    read: false,
    urgent: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    actionUrl: '/dashboard/policies',
    actionText: 'View Policy',
  },
  {
    id: '3',
    type: 'organization',
    title: 'New Organization Member',
    message: 'John Doe has joined your organization',
    read: true,
    urgent: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    actionUrl: '/dashboard/users',
    actionText: 'View User',
  },
  {
    id: '4',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur this weekend',
    read: true,
    urgent: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
  },
];

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      security: true,
      policy: true,
      organization: true,
      user: false,
      system: false,
    },
    inApp: {
      security: true,
      policy: true,
      organization: true,
      user: true,
      system: true,
    },
    digest: {
      enabled: true,
      frequency: 'daily',
    },
  });

  useBreadcrumb([
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
  ]);

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'urgent') return notification.urgent;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const urgentCount = notifications.filter((n) => n.urgent).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast({
      title: 'Success',
      description: 'All notifications marked as read',
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast({
      title: 'Success',
      description: 'Notification deleted',
    });
  };

  const archiveNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast({
      title: 'Success',
      description: 'Notification archived',
    });
  };

  const updatePreferences = (
    category: 'email' | 'inApp',
    type: keyof NotificationPreferences['email'],
    value: boolean,
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: value,
      },
    }));
  };

  const savePreferences = () => {
    // Here you would typically make an API call to save preferences
    toast({
      title: 'Success',
      description: 'Notification preferences saved',
    });
  };

  const getNotificationIcon = (type: string) => {
    const config = NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES];
    if (!config) return Bell;
    return config.icon;
  };

  const getNotificationColor = (type: string) => {
    const config = NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES];
    if (!config) return 'text-gray-600';
    return config.color;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Stay updated with important events and changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Notifications</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">Urgent</p>
                <p className="text-2xl font-bold">{urgentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </Button>
                <Button
                  variant={filter === 'urgent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('urgent')}
                >
                  Urgent ({urgentCount})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="space-y-2">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No notifications found</p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);

                return (
                  <Card
                    key={notification.id}
                    className={`transition-colors hover:bg-muted/50 ${
                      !notification.read ? 'border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{notification.title}</p>
                              {!notification.read && (
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
                              )}
                              {notification.urgent && (
                                <Badge variant="destructive" className="text-xs">
                                  Urgent
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{format(notification.createdAt, 'MMM d, yyyy h:mm a')}</span>
                              {notification.actionUrl && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-xs"
                                  onClick={() => {
                                    markAsRead(notification.id);
                                    // Navigate to actionUrl
                                  }}
                                >
                                  {notification.actionText}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => archiveNotification(notification.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications for different types of events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </h3>
                <div className="space-y-3">
                  {Object.entries(NOTIFICATION_TYPES).map(([type, config]) => (
                    <div key={type} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <config.icon className={`h-4 w-4 ${config.color}`} />
                        <span className="text-sm">{config.label}</span>
                      </div>
                      <Switch
                        checked={preferences.email[type as keyof typeof preferences.email]}
                        onCheckedChange={(checked) =>
                          updatePreferences(
                            'email',
                            type as keyof NotificationPreferences['email'],
                            checked,
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* In-App Notifications */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  In-App Notifications
                </h3>
                <div className="space-y-3">
                  {Object.entries(NOTIFICATION_TYPES).map(([type, config]) => (
                    <div key={type} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <config.icon className={`h-4 w-4 ${config.color}`} />
                        <span className="text-sm">{config.label}</span>
                      </div>
                      <Switch
                        checked={preferences.inApp[type as keyof typeof preferences.inApp]}
                        onCheckedChange={(checked) =>
                          updatePreferences(
                            'inApp',
                            type as keyof NotificationPreferences['email'],
                            checked,
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Digest Settings */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Digest Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Email Digest</p>
                      <p className="text-xs text-muted-foreground">
                        Receive a summary of notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={preferences.digest.enabled}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          digest: { ...prev.digest, enabled: checked },
                        }))
                      }
                    />
                  </div>
                  {preferences.digest.enabled && (
                    <div className="space-y-2">
                      <Label htmlFor="digest-frequency">Frequency</Label>
                      <select
                        id="digest-frequency"
                        value={preferences.digest.frequency}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            digest: {
                              ...prev.digest,
                              frequency: e.target.value as 'daily' | 'weekly' | 'monthly',
                            },
                          }))
                        }
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={savePreferences}>
                  <Settings className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
