'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Users,
  Shield,
  Package,
  UserCheck,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrganizationStats {
  id: string;
  name: string;
  type: string;
  status: string;
  directChildrenCount: number;
  totalDescendantsCount: number;
  directUsersCount: number;
  totalUsersCount: number;
  directPoliciesCount: number;
  totalPoliciesCount: number;
  productsCount: number;
  customersCount: number;
}

interface OrganizationStatsProps {
  stats: OrganizationStats;
  showComparison?: boolean;
  comparisonStats?: OrganizationStats;
  className?: string;
}

export const OrganizationStats: React.FC<OrganizationStatsProps> = ({
  stats,
  showComparison = false,
  comparisonStats,
  className,
}) => {
  const getPercentageChange = (current: number, comparison?: number): number | null => {
    if (!comparison || comparison === 0) return null;
    return ((current - comparison) / comparison) * 100;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getChangeIndicator = (current: number, comparison?: number) => {
    if (!showComparison || !comparison) return null;

    const change = getPercentageChange(current, comparison);
    if (change === null || change === 0) return null;

    const isPositive = change > 0;
    return (
      <span className={cn('text-xs font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
        {isPositive ? '+' : ''}
        {change.toFixed(1)}%
      </span>
    );
  };

  const StatCard = ({
    title,
    value,
    comparison,
    icon: Icon,
    description,
    color = 'blue',
  }: {
    title: string;
    value: number;
    comparison?: number;
    icon: React.ElementType;
    description?: string;
    color?: string;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
      pink: 'bg-pink-50 text-pink-600',
    };

    return (
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold">{formatNumber(value)}</p>
            {getChangeIndicator(value, comparison)}
          </div>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className={cn('rounded-lg p-3', colorClasses[color as keyof typeof colorClasses])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    );
  };

  const getOrganizationHealth = (): number => {
    // Calculate a health score based on various metrics
    let score = 0;

    // Active status
    if (stats.status === 'active') score += 20;

    // Has users
    if (stats.totalUsersCount > 0) score += 20;

    // Has policies
    if (stats.totalPoliciesCount > 0) score += 20;

    // Has business activity
    if (stats.productsCount > 0 || stats.customersCount > 0) score += 20;

    // Has structure (children or is part of hierarchy)
    if (stats.totalDescendantsCount > 0) score += 20;

    return score;
  };

  const healthScore = getOrganizationHealth();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{stats.name}</CardTitle>
              <CardDescription>Organization performance and statistics</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {stats.type}
              </Badge>
              <Badge
                variant={stats.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {stats.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Organization Health</span>
              <span className="text-sm text-muted-foreground">{healthScore}%</span>
            </div>
            <Progress value={healthScore} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Based on activity, structure, and configuration
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Structure Stats */}
      <div>
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">ORGANIZATIONAL STRUCTURE</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title="Direct Children"
            value={stats.directChildrenCount}
            comparison={comparisonStats?.directChildrenCount}
            icon={Building2}
            description="Immediate sub-organizations"
            color="blue"
          />
          <StatCard
            title="Total Descendants"
            value={stats.totalDescendantsCount}
            comparison={comparisonStats?.totalDescendantsCount}
            icon={Layers}
            description="All organizations in hierarchy"
            color="purple"
          />
        </div>
      </div>

      {/* User Stats */}
      <div>
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">USER METRICS</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title="Direct Users"
            value={stats.directUsersCount}
            comparison={comparisonStats?.directUsersCount}
            icon={Users}
            description="Users in this organization"
            color="green"
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsersCount}
            comparison={comparisonStats?.totalUsersCount}
            icon={UserCheck}
            description="Including sub-organizations"
            color="green"
          />
        </div>
      </div>

      {/* Security & Business Stats */}
      <div>
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">SECURITY & BUSINESS</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Direct Policies"
            value={stats.directPoliciesCount}
            comparison={comparisonStats?.directPoliciesCount}
            icon={Shield}
            color="orange"
          />
          <StatCard
            title="Total Policies"
            value={stats.totalPoliciesCount}
            comparison={comparisonStats?.totalPoliciesCount}
            icon={Shield}
            color="orange"
          />
          <StatCard
            title="Products"
            value={stats.productsCount}
            comparison={comparisonStats?.productsCount}
            icon={Package}
            color="pink"
          />
          <StatCard
            title="Customers"
            value={stats.customersCount}
            comparison={comparisonStats?.customersCount}
            icon={Users}
            color="pink"
          />
        </div>
      </div>

      {/* Activity Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">User Engagement</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={
                    stats.totalUsersCount > 0
                      ? Math.min((stats.directUsersCount / stats.totalUsersCount) * 100, 100)
                      : 0
                  }
                  className="h-2 w-24"
                />
                <span className="text-sm text-muted-foreground">
                  {stats.totalUsersCount > 0
                    ? `${((stats.directUsersCount / stats.totalUsersCount) * 100).toFixed(0)}%`
                    : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Business Activity</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={stats.productsCount + stats.customersCount > 0 ? 75 : 0}
                  className="h-2 w-24"
                />
                <span className="text-sm text-muted-foreground">
                  {stats.productsCount + stats.customersCount > 0 ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
