'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Shield, Package, ShoppingCart, CreditCard } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export default function DashboardPage() {
  const { t } = useTranslation();
  
  const stats = [
    { key: 'dashboard.stats.totalOrganizations', value: '12', icon: Building2, color: 'text-primary' },
    { key: 'dashboard.stats.totalUsers', value: '248', icon: Users, color: 'text-chart-1' },
    { key: 'dashboard.stats.activePolicies', value: '64', icon: Shield, color: 'text-chart-2' },
    { key: 'dashboard.stats.products', value: '156', icon: Package, color: 'text-chart-3' },
    { key: 'dashboard.stats.ordersToday', value: '24', icon: ShoppingCart, color: 'text-chart-4' },
    { key: 'dashboard.stats.revenueToday', value: '$12,450', icon: CreditCard, color: 'text-chart-5' },
  ];
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
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
                <div className="h-2 w-2 rounded-full bg-chart-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('dashboard.recentActivity.newUserRegistered')}</p>
                  <p className="text-xs text-muted-foreground">john.doe@example.com - {t('time.minutesAgo', { count: 2 })}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 rounded-full bg-chart-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('dashboard.recentActivity.organizationCreated')}</p>
                  <p className="text-xs text-muted-foreground">Acme Corp - {t('time.minutesAgo', { count: 15 })}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 rounded-full bg-chart-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('dashboard.recentActivity.policyUpdated')}</p>
                  <p className="text-xs text-muted-foreground">Admin Access Policy - {t('time.hoursAgo', { count: 1 })}</p>
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
                  <span className="text-sm text-chart-1">45ms</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 w-3/4 rounded-full bg-chart-1" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('dashboard.systemHealth.databaseLoad')}</span>
                  <span className="text-sm text-chart-3">62%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 w-3/5 rounded-full bg-chart-3" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('dashboard.systemHealth.cacheHitRate')}</span>
                  <span className="text-sm text-chart-1">94%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 w-11/12 rounded-full bg-chart-1" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
