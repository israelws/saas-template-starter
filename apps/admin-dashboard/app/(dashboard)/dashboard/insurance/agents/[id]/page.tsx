'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { insuranceAgentAPI, territoryAPI } from '@/lib/api';
import { InsuranceAgent, Territory, LicenseStatus, InsuranceType } from '@saas-template/shared';
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Building,
  Calendar,
  MapPin,
  DollarSign,
  Award,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

const licenseStatusColors: Record<LicenseStatus, string> = {
  [LicenseStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [LicenseStatus.EXPIRED]: 'bg-red-100 text-red-800',
  [LicenseStatus.SUSPENDED]: 'bg-yellow-100 text-yellow-800',
  [LicenseStatus.PENDING]: 'bg-gray-100 text-gray-800',
};

export default function InsuranceAgentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [agent, setAgent] = useState<InsuranceAgent | null>(null);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAgentDetails = useCallback(async () => {
    try {
      const response = await insuranceAgentAPI.getById(params.id as string);
      setAgent(response.data);

      // Fetch territories if agent has any
      if (response.data.territoryIds && response.data.territoryIds.length > 0) {
        const territoriesResponse = await territoryAPI.getByIds(response.data.territoryIds);
        setTerritories(territoriesResponse.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch agent details',
        variant: 'destructive',
      });
      router.push('/dashboard/insurance/agents');
    } finally {
      setIsLoading(false);
    }
  }, [params.id, toast, router]);

  useEffect(() => {
    if (params.id) {
      fetchAgentDetails();
    }
  }, [params.id, fetchAgentDetails]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await insuranceAgentAPI.delete(params.id as string);
      toast({
        title: 'Success',
        description: 'Agent deactivated successfully',
      });
      router.push('/dashboard/insurance/agents');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate agent',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate: Date) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return <div className="py-10 text-center">Loading...</div>;
  }

  if (!agent) {
    return <div className="py-10 text-center">Agent not found</div>;
  }

  const daysUntilExpiry = getDaysUntilExpiry(agent.licenseExpiryDate);
  const licenseExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const licenseExpired = daysUntilExpiry <= 0;

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/insurance/agents')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Agents
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {agent.user?.name || 'Agent Details'}
            </h1>
            <p className="text-gray-500">Agent Code: {agent.agentCode}</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/insurance/agents/${agent.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Deactivate
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Award className="mr-2 h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">License Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className={licenseStatusColors[agent.licenseStatus]}>
              {agent.licenseStatus}
            </Badge>
            {licenseExpiringSoon && (
              <p className="mt-2 text-xs text-yellow-600">Expires in {daysUntilExpiry} days</p>
            )}
            {licenseExpired && (
              <p className="mt-2 text-xs text-red-600">
                Expired {Math.abs(daysUntilExpiry)} days ago
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agent.commissionRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Policies Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agent.performanceMetrics?.totalPoliciesSold || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Building className="mr-2 h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{agent.branch?.branchName || 'Unassigned'}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="license">License Details</TabsTrigger>
          <TabsTrigger value="territories">Territories</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Agent Information</CardTitle>
              <CardDescription>Basic information about the insurance agent</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{agent.user?.name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{agent.user?.email || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Agent Code</dt>
                  <dd className="mt-1 text-sm text-gray-900">{agent.agentCode}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Joined Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(agent.createdAt), 'PPP')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(agent.updatedAt), 'PPP')}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="license">
          <Card>
            <CardHeader>
              <CardTitle>License Information</CardTitle>
              <CardDescription>License details and validity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">License Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{agent.licenseNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(agent.licenseExpiryDate), 'PPP')}
                    {licenseExpiringSoon && (
                      <span className="ml-2 text-yellow-600">
                        <AlertCircle className="inline h-4 w-4" />
                      </span>
                    )}
                  </dd>
                </div>
              </dl>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">License Types</h4>
                <div className="flex flex-wrap gap-2">
                  {agent.licenseType.map((type) => (
                    <Badge key={type} variant="secondary">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              {agent.specializations && agent.specializations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.specializations.map((spec) => (
                      <Badge key={spec} variant="outline">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="territories">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Territories</CardTitle>
              <CardDescription>Geographic areas this agent covers</CardDescription>
            </CardHeader>
            <CardContent>
              {territories.length > 0 ? (
                <div className="space-y-4">
                  {territories.map((territory) => (
                    <div
                      key={territory.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{territory.name}</p>
                          <p className="text-sm text-gray-500">
                            {territory.type} • {territory.code}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No territories assigned</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Agent performance and sales statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {agent.performanceMetrics ? (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Policies Sold</dt>
                    <dd className="mt-1 text-2xl font-bold text-gray-900">
                      {agent.performanceMetrics.totalPoliciesSold}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Total Premium Volume</dt>
                    <dd className="mt-1 text-2xl font-bold text-gray-900">
                      ${agent.performanceMetrics.totalPremiumVolume.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Average Policy Value</dt>
                    <dd className="mt-1 text-2xl font-bold text-gray-900">
                      ${agent.performanceMetrics.averagePolicyValue.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Customer Retention Rate</dt>
                    <dd className="mt-1 text-2xl font-bold text-gray-900">
                      {agent.performanceMetrics.customerRetentionRate}%
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-500">No performance data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Deactivate Agent"
        description={`Are you sure you want to deactivate ${agent.user?.name}? This will prevent them from accessing the system.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        variant="destructive"
        loading={isDeleting}
      />
    </div>
  );
}
