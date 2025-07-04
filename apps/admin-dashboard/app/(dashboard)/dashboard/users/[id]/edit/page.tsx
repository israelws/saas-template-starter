'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { userAPI } from '@/lib/api'
import { ArrowLeft } from 'lucide-react'

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    status: 'active',
  })

  useEffect(() => {
    if (params.id) {
      fetchUser()
    }
  }, [params.id])

  const fetchUser = async () => {
    try {
      const response = await userAPI.getById(params.id as string)
      const user = response.data
      setFormData({
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        status: user.status,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch user details',
        variant: 'destructive',
      })
      router.push('/dashboard/users')
    } finally {
      setIsFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await userAPI.update(params.id as string, formData)
      toast({
        title: 'Success',
        description: 'User updated successfully',
      })
      router.push(`/dashboard/users/${params.id}`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update user',
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
          onClick={() => router.push(`/dashboard/users/${params.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to User
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
        <p className="text-gray-500">Update user details</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>
              Update the user information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="John"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Doe"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="john.doe@example.com"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Changing email will require the user to verify the new address
              </p>
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
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Password changes must be done by the user through the password reset flow.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/users/${params.id}`)}
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