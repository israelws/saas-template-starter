'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { organizationAPI } from '@/lib/api'
import { Organization } from '@saas-template/shared'
import { ArrowLeft } from 'lucide-react'

const organizationTypes = [
  { value: 'company', label: 'Company' },
  { value: 'division', label: 'Division' },
  { value: 'department', label: 'Department' },
  { value: 'team', label: 'Team' },
]

export default function EditOrganizationPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    type: 'company',
    status: 'active',
  })

  useEffect(() => {
    if (params.id) {
      fetchOrganization()
    }
  }, [params.id])

  const fetchOrganization = async () => {
    try {
      const response = await organizationAPI.getById(params.id as string)
      const org = response.data
      setFormData({
        name: org.name,
        code: org.code,
        description: org.description || '',
        type: org.type,
        status: org.status,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch organization details',
        variant: 'destructive',
      })
      router.push('/dashboard/organizations')
    } finally {
      setIsFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await organizationAPI.update(params.id as string, formData)
      toast({
        title: 'Success',
        description: 'Organization updated successfully',
      })
      router.push(`/dashboard/organizations/${params.id}`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update organization',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  if (isFetching) {
    return <div className="py-10 text-center">Loading...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/organizations/${params.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organization
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Organization</h1>
        <p className="text-gray-500">Update organization details</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>
              Update the organization information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Acme Corporation"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  placeholder="ACME"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  A unique identifier for the organization
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter a description for the organization"
                rows={4}
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange('type', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {organizationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/organizations/${params.id}`)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}