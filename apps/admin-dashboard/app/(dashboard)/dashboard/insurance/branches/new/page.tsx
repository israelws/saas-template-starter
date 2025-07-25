'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { insuranceBranchAPI, organizationAPI, userAPI } from '@/lib/api';
import {
  InsuranceType,
  CreateInsuranceBranchDto,
  Organization,
  OrganizationType,
  User,
  DayHours,
} from '@saas-template/shared';
import { ArrowLeft, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const insuranceTypes: { value: InsuranceType; label: string }[] = [
  { value: InsuranceType.LIFE, label: 'Life Insurance' },
  { value: InsuranceType.HEALTH, label: 'Health Insurance' },
  { value: InsuranceType.PROPERTY, label: 'Property Insurance' },
  { value: InsuranceType.CASUALTY, label: 'Casualty Insurance' },
  { value: InsuranceType.AUTO, label: 'Auto Insurance' },
  { value: InsuranceType.DISABILITY, label: 'Disability Insurance' },
  { value: InsuranceType.LONG_TERM_CARE, label: 'Long Term Care' },
  { value: InsuranceType.BUSINESS, label: 'Business Insurance' },
];

const weekDays = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const defaultHours: DayHours = { open: '09:00', close: '17:00' };

export default function NewInsuranceBranchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<CreateInsuranceBranchDto>({
    organizationId: '',
    branchCode: '',
    branchName: '',
    managerId: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'USA',
    },
    phoneNumber: '',
    email: '',
    operatingHours: {
      monday: { ...defaultHours },
      tuesday: { ...defaultHours },
      wednesday: { ...defaultHours },
      thursday: { ...defaultHours },
      friday: { ...defaultHours },
      saturday: { open: '09:00', close: '13:00' },
      sunday: { open: '09:00', close: '13:00', isClosed: true },
    },
    serviceTypes: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [orgsResponse, usersResponse] = await Promise.all([
        organizationAPI.getAll(),
        userAPI.getAll({ limit: 100 }),
      ]);

      // Filter to only show insurance branch organizations
      const branchOrgs = orgsResponse.data.items.filter(
        (org: Organization) => org.type === OrganizationType.INSURANCE_BRANCH,
      );
      setOrganizations(branchOrgs);
      setUsers(usersResponse.data.items || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.serviceTypes.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one service type',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await insuranceBranchAPI.create(formData);
      toast({
        title: 'Success',
        description: 'Insurance branch created successfully',
      });
      router.push('/dashboard/insurance/branches');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create branch',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof CreateInsuranceBranchDto | string, value: any) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData({
        ...formData,
        address: { ...formData.address, [addressField]: value },
      });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleServiceTypeToggle = (type: InsuranceType) => {
    const currentTypes = formData.serviceTypes || [];
    if (currentTypes.includes(type)) {
      handleChange(
        'serviceTypes',
        currentTypes.filter((t) => t !== type),
      );
    } else {
      handleChange('serviceTypes', [...currentTypes, type]);
    }
  };

  const handleOperatingHoursChange = (
    day: string,
    field: 'open' | 'close' | 'isClosed',
    value: any,
  ) => {
    setFormData({
      ...formData,
      operatingHours: {
        ...formData.operatingHours,
        [day]: {
          ...formData.operatingHours[day as keyof typeof formData.operatingHours],
          [field]: value,
        },
      },
    });
  };

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/insurance/branches')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Branches
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create Insurance Branch</h1>
        <p className="text-gray-500">Add a new insurance branch location</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Branch Information</CardTitle>
              <CardDescription>Basic information about the insurance branch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organizationId">Organization *</Label>
                  <Select
                    value={formData.organizationId}
                    onValueChange={(value) => handleChange('organizationId', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="organizationId">
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Only insurance branch organizations are shown
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerId">Branch Manager</Label>
                  <Select
                    value={formData.managerId || ''}
                    onValueChange={(value) => handleChange('managerId', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="managerId">
                      <SelectValue placeholder="Select manager (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No manager</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchCode">Branch Code *</Label>
                  <Input
                    id="branchCode"
                    value={formData.branchCode}
                    onChange={(e) => handleChange('branchCode', e.target.value.toUpperCase())}
                    placeholder="BR001"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchName">Branch Name *</Label>
                  <Input
                    id="branchName"
                    value={formData.branchName}
                    onChange={(e) => handleChange('branchName', e.target.value)}
                    placeholder="Downtown Branch"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location & Contact</CardTitle>
              <CardDescription>Branch address and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    value={formData.address.street}
                    onChange={(e) => handleChange('address.street', e.target.value)}
                    placeholder="123 Main Street"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.address.city}
                      onChange={(e) => handleChange('address.city', e.target.value)}
                      placeholder="New York"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.address.state}
                      onChange={(e) => handleChange('address.state', e.target.value)}
                      placeholder="NY"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">ZIP Code *</Label>
                    <Input
                      id="postalCode"
                      value={formData.address.postalCode}
                      onChange={(e) => handleChange('address.postalCode', e.target.value)}
                      placeholder="10001"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="branch@insurance.com"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Types</CardTitle>
              <CardDescription>
                Select the types of insurance services offered at this branch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {insuranceTypes.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`service-${type.value}`}
                      checked={formData.serviceTypes.includes(type.value)}
                      onCheckedChange={() => handleServiceTypeToggle(type.value)}
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor={`service-${type.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operating Hours</CardTitle>
              <CardDescription>Set the operating hours for each day of the week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weekDays.map((day) => {
                  const hours =
                    formData.operatingHours[day.key as keyof typeof formData.operatingHours];
                  return (
                    <div key={day.key} className="flex items-center gap-4">
                      <div className="w-32">
                        <Label className="text-sm">{day.label}</Label>
                      </div>
                      <Switch
                        checked={!hours?.isClosed}
                        onCheckedChange={(checked) =>
                          handleOperatingHoursChange(day.key, 'isClosed', !checked)
                        }
                        disabled={isLoading}
                      />
                      {!hours?.isClosed && (
                        <>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <Input
                              type="time"
                              value={hours?.open || '09:00'}
                              onChange={(e) =>
                                handleOperatingHoursChange(day.key, 'open', e.target.value)
                              }
                              className="w-24"
                              disabled={isLoading}
                            />
                            <span className="text-sm text-gray-500">to</span>
                            <Input
                              type="time"
                              value={hours?.close || '17:00'}
                              onChange={(e) =>
                                handleOperatingHoursChange(day.key, 'close', e.target.value)
                              }
                              className="w-24"
                              disabled={isLoading}
                            />
                          </div>
                        </>
                      )}
                      {hours?.isClosed && <span className="text-sm text-gray-500">Closed</span>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/insurance/branches')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Branch'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
