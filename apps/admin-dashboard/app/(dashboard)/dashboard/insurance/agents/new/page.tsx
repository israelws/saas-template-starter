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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { insuranceAgentAPI, insuranceBranchAPI, userAPI } from '@/lib/api';
import {
  InsuranceType,
  CreateInsuranceAgentDto,
  User,
  InsuranceBranch,
} from '@saas-template/shared';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

export default function NewInsuranceAgentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<InsuranceBranch[]>([]);
  const [formData, setFormData] = useState<CreateInsuranceAgentDto>({
    userId: '',
    branchId: '',
    agentCode: '',
    licenseNumber: '',
    licenseType: [],
    licenseExpiryDate: new Date(),
    commissionRate: 0,
    specializations: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersResponse, branchesResponse] = await Promise.all([
        userAPI.getAll({ limit: 100 }),
        insuranceBranchAPI.getAll({ limit: 100 }),
      ]);
      setUsers(usersResponse.data.items || []);
      setBranches(branchesResponse.data.items || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.licenseType.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one license type',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await insuranceAgentAPI.create(formData);
      toast({
        title: 'Success',
        description: 'Insurance agent created successfully',
      });
      router.push('/dashboard/insurance/agents');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create agent',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof CreateInsuranceAgentDto, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleLicenseTypeToggle = (type: InsuranceType) => {
    const currentTypes = formData.licenseType || [];
    if (currentTypes.includes(type)) {
      handleChange(
        'licenseType',
        currentTypes.filter((t) => t !== type),
      );
    } else {
      handleChange('licenseType', [...currentTypes, type]);
    }
  };

  const handleSpecializationToggle = (type: InsuranceType) => {
    const currentSpecs = formData.specializations || [];
    if (currentSpecs.includes(type)) {
      handleChange(
        'specializations',
        currentSpecs.filter((t) => t !== type),
      );
    } else {
      handleChange('specializations', [...currentSpecs, type]);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Create Insurance Agent</h1>
        <p className="text-gray-500">Add a new insurance agent to the system</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Information</CardTitle>
              <CardDescription>Basic information about the insurance agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="userId">User *</Label>
                  <Select
                    value={formData.userId}
                    onValueChange={(value) => handleChange('userId', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="userId">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchId">Branch *</Label>
                  <Select
                    value={formData.branchId}
                    onValueChange={(value) => handleChange('branchId', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="branchId">
                      <SelectValue placeholder="Select a branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.branchName} ({branch.branchCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentCode">Agent Code *</Label>
                  <Input
                    id="agentCode"
                    value={formData.agentCode}
                    onChange={(e) => handleChange('agentCode', e.target.value.toUpperCase())}
                    placeholder="AGT001"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commissionRate">Commission Rate (%) *</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.commissionRate}
                    onChange={(e) => handleChange('commissionRate', parseFloat(e.target.value))}
                    placeholder="10.5"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>License Information</CardTitle>
              <CardDescription>Agent license details and validity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number *</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => handleChange('licenseNumber', e.target.value)}
                    placeholder="LIC-123456"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseExpiryDate">License Expiry Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.licenseExpiryDate && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.licenseExpiryDate ? (
                          format(formData.licenseExpiryDate, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.licenseExpiryDate}
                        onSelect={(date) => date && handleChange('licenseExpiryDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>License Types *</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select all insurance types this agent is licensed to sell
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {insuranceTypes.map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`license-${type.value}`}
                          checked={formData.licenseType.includes(type.value)}
                          onCheckedChange={() => handleLicenseTypeToggle(type.value)}
                          disabled={isLoading}
                        />
                        <Label
                          htmlFor={`license-${type.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Specializations</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select areas of specialization (must be from licensed types)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {insuranceTypes.map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`spec-${type.value}`}
                          checked={formData.specializations?.includes(type.value) || false}
                          onCheckedChange={() => handleSpecializationToggle(type.value)}
                          disabled={isLoading || !formData.licenseType.includes(type.value)}
                        />
                        <Label
                          htmlFor={`spec-${type.value}`}
                          className={cn(
                            'text-sm font-normal cursor-pointer',
                            !formData.licenseType.includes(type.value) && 'text-muted-foreground',
                          )}
                        >
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/insurance/agents')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
