'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Bell, Shield, Database, Globe, Mail } from 'lucide-react';
import { EmailServiceIntegrations } from './email-service-integrations';

export default function SettingsPage() {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentOrganizationId = useSelector((state: RootState) => state.auth.currentOrganizationId);
  const isSuperAdmin = currentUser?.metadata?.isSuperAdmin === true;
  
  const isOrgAdmin = (() => {
    if (!currentUser || !currentOrganizationId) return false;
    const membership = currentUser.organizationMemberships?.find(
      m => m.organizationId === currentOrganizationId
    );
    return membership?.role === 'admin' || membership?.role === 'owner';
  })();

  // Debug logging
  useEffect(() => {
    console.log('Settings page - Current user:', currentUser);
    console.log('Settings page - Is super admin:', isSuperAdmin);
    console.log('Settings page - Is org admin:', isOrgAdmin);
    console.log('Settings page - Current org ID:', currentOrganizationId);
  }, [currentUser, isSuperAdmin, isOrgAdmin, currentOrganizationId]);
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your application settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          {(isSuperAdmin || isOrgAdmin) && (
            <TabsTrigger value="email-services">Email Services</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure general application settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center py-10 text-gray-500">
                  <Settings className="mr-2 h-5 w-5" />
                  <p>General settings coming soon...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center py-10 text-gray-500">
                  <Bell className="mr-2 h-5 w-5" />
                  <p>Notification settings coming soon...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security and access control</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center py-10 text-gray-500">
                  <Shield className="mr-2 h-5 w-5" />
                  <p>Security settings coming soon...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Database Settings</CardTitle>
              <CardDescription>Database configuration and maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center py-10 text-gray-500">
                  <Database className="mr-2 h-5 w-5" />
                  <p>Database settings coming soon...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Third-party integrations and APIs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center py-10 text-gray-500">
                  <Globe className="mr-2 h-5 w-5" />
                  <p>Integrations coming soon...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {(isSuperAdmin || isOrgAdmin) && (
          <TabsContent value="email-services">
            <EmailServiceIntegrations 
              organizationId={isOrgAdmin && !isSuperAdmin ? currentOrganizationId : undefined}
              isSystemLevel={isSuperAdmin}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
