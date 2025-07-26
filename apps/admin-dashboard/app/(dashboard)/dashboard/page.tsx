'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Shield, Package, ShoppingCart, CreditCard } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export default function DashboardPage() {
  const { t } = useTranslation();
  
  const stats = [
    { key: 'dashboard.stats.totalOrganizations', value: '12', icon: Building2, color: 'text-blue-600' },
    { key: 'dashboard.stats.totalUsers', value: '248', icon: Users, color: 'text-green-600' },
    { key: 'dashboard.stats.activePolicies', value: '64', icon: Shield, color: 'text-purple-600' },
    { key: 'dashboard.stats.products', value: '156', icon: Package, color: 'text-yellow-600' },
    { key: 'dashboard.stats.ordersToday', value: '24', icon: ShoppingCart, color: 'text-pink-600' },
    { key: 'dashboard.stats.revenueToday', value: '$12,450', icon: CreditCard, color: 'text-indigo-600' },
  ];
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-gray-500">{t('dashboard.welcome')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t(stat.key)}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity.title')}</CardTitle>
            <CardDescription>{t('dashboard.recentActivity.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('dashboard.recentActivity.newUserRegistered')}</p>
                  <p className="text-xs text-gray-500">john.doe@example.com - {t('time.minutesAgo', { count: 2 })}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('dashboard.recentActivity.organizationCreated')}</p>
                  <p className="text-xs text-gray-500">Acme Corp - {t('time.minutesAgo', { count: 15 })}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('dashboard.recentActivity.policyUpdated')}</p>
                  <p className="text-xs text-gray-500">Admin Access Policy - {t('time.hoursAgo', { count: 1 })}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.systemHealth.title')}</CardTitle>
            <CardDescription>{t('dashboard.systemHealth.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('dashboard.systemHealth.apiResponseTime')}</span>
                  <span className="text-sm text-green-600">45ms</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                  <div className="h-2 w-3/4 rounded-full bg-green-600" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('dashboard.systemHealth.databaseLoad')}</span>
                  <span className="text-sm text-yellow-600">62%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                  <div className="h-2 w-3/5 rounded-full bg-yellow-600" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('dashboard.systemHealth.cacheHitRate')}</span>
                  <span className="text-sm text-green-600">94%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                  <div className="h-2 w-11/12 rounded-full bg-green-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
