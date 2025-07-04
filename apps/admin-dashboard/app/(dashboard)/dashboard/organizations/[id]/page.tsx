'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { organizationAPI } from '@/lib/api'
import { Organization } from '@saas-template/shared'
import {
  ArrowLeft,
  Building2,
  Users,
  Shield,
  Settings,
  Edit,
  Trash2,
} from 'lucide-react'

export default function OrganizationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchOrganization()
    }
  }, [params.id])

  const fetchOrganization = async () => {
    try {
      const response = await organizationAPI.getById(params.id as string)
      setOrganization(response.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch organization details',
        variant: 'destructive',
      })
      router.push('/dashboard/organizations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this organization?')) {
      return
    }

    try {
      await organizationAPI.delete(params.id as string)
      toast({
        title: 'Success',
        description: 'Organization deleted successfully',
      })
      router.push('/dashboard/organizations')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete organization',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return <div className="py-10 text-center">Loading...</div>
  }

  if (!organization) {
    return <div className="py-10 text-center">Organization not found</div>
  }

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/organizations')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organizations
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {organization.name}
            </h1>
            <p className="text-gray-500">{organization.description}</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/dashboard/organizations/${organization.id}/edit`)
              }
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {organization.type}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {organization.status}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organization.memberships?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Basic information about this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Code</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {organization.code}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {organization.type}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {organization.status}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Created At
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(organization.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
              {organization.settings && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500">
                    Settings
                  </h3>
                  <pre className="mt-2 rounded bg-gray-100 p-2 text-xs">
                    {JSON.stringify(organization.settings, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Users who belong to this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Member management coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <CardTitle>Organization Hierarchy</CardTitle>
              <CardDescription>
                Parent and child organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Hierarchy view coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure organization settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Settings management coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}