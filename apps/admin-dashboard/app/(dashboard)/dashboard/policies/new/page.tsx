'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { policyAPI } from '@/lib/api'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

interface Condition {
  field: string
  operator: string
  value: string
}

export default function NewPolicyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [conditions, setConditions] = useState<Condition[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    resource: '',
    action: '',
    effect: 'allow',
    priority: '50',
    status: 'active',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const policyData = {
      ...formData,
      priority: parseInt(formData.priority),
      conditions: conditions.reduce((acc, cond) => {
        if (cond.field && cond.value) {
          acc[cond.field] = { [cond.operator]: cond.value }
        }
        return acc
      }, {} as Record<string, any>),
    }

    try {
      await policyAPI.create(policyData)
      toast({
        title: 'Success',
        description: 'Policy created successfully',
      })
      router.push('/dashboard/policies')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create policy',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const addCondition = () => {
    setConditions([...conditions, { field: '', operator: 'equals', value: '' }])
  }

  const updateCondition = (index: number, field: string, value: string) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], [field]: value }
    setConditions(updated)
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/policies')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Policies
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create Policy</h1>
        <p className="text-gray-500">Define a new access control policy</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                General policy details and metadata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Policy Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Admin Full Access"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe what this policy allows or denies"
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher priority policies are evaluated first (0-100)
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Policy Rules</CardTitle>
              <CardDescription>
                Define what resources and actions this policy applies to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="resource">Resource *</Label>
                  <Input
                    id="resource"
                    value={formData.resource}
                    onChange={(e) => handleChange('resource', e.target.value)}
                    placeholder="e.g., organization:*, user:read"
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use wildcards (*) to match multiple resources
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action">Action *</Label>
                  <Input
                    id="action"
                    value={formData.action}
                    onChange={(e) => handleChange('action', e.target.value)}
                    placeholder="e.g., *, read, write, delete"
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use wildcards (*) to match all actions
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="effect">Effect *</Label>
                <Select
                  value={formData.effect}
                  onValueChange={(value) => handleChange('effect', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="effect">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allow">Allow</SelectItem>
                    <SelectItem value="deny">Deny</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Deny takes precedence over allow
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conditions</CardTitle>
              <CardDescription>
                Optional conditions that must be met for this policy to apply
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {conditions.map((condition, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Field (e.g., user.role)"
                    value={condition.field}
                    onChange={(e) => updateCondition(index, 'field', e.target.value)}
                    disabled={isLoading}
                  />
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(index, 'operator', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="notEquals">Not Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="in">In</SelectItem>
                      <SelectItem value="regex">Regex</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Value"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition(index)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addCondition}
                disabled={isLoading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Condition
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/policies')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Policy'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}