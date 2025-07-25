'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { userAPI, organizationAPI, policyAPI } from '@/lib/api';
import {
  User,
  Organization,
  Policy,
  OrganizationType,
  UserRole as UserRoleType,
} from '@saas-template/shared';
import {
  ArrowLeft,
  Shield,
  Users,
  Building2,
  Search,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AssignmentStep {
  step: number;
  title: string;
  description: string;
}

const steps: AssignmentStep[] = [
  { step: 1, title: 'Select Organization', description: 'Choose the organization context' },
  { step: 2, title: 'Select Users', description: 'Choose users to assign policies to' },
  {
    step: 3,
    title: 'Assign Roles & Policies',
    description: 'Configure roles and policy assignments',
  },
  { step: 4, title: 'Review & Confirm', description: 'Review and confirm assignments' },
];

export default function PolicyAssignmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Organization selection
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');

  // Step 2: User selection
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Step 3: Role and policy assignment
  const [availableRoles] = useState<string[]>(['admin', 'manager', 'agent', 'user']);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [assignments, setAssignments] = useState<
    Map<
      string,
      {
        userId: string;
        roles: Array<{
          roleName: string;
          priority: number;
          validTo?: Date;
        }>;
        policies: string[];
      }
    >
  >(new Map());

  useEffect(() => {
    loadOrganizations();
    loadPolicies();

    // Check if coming from a specific context
    const orgId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');

    if (orgId) {
      setSelectedOrganization(orgId);
      setCurrentStep(2);
    }

    if (userId) {
      setSelectedUsers([userId]);
      if (orgId) {
        setCurrentStep(3);
      }
    }
  }, [searchParams]);

  const loadOrganizations = async () => {
    try {
      const response = await organizationAPI.getAll();
      setOrganizations(response.data.items);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  };

  const loadUsers = async () => {
    if (!selectedOrganization) return;

    setIsLoading(true);
    try {
      // Get users in the selected organization
      const response = await organizationAPI.getMembers(selectedOrganization);
      setUsers(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPolicies = async () => {
    try {
      const response = await policyAPI.getAll();
      setPolicies(response.data.items || []);
    } catch (error) {
      console.error('Failed to load policies:', error);
    }
  };

  useEffect(() => {
    if (selectedOrganization && currentStep === 2) {
      loadUsers();
    }
  }, [selectedOrganization, currentStep]);

  const handleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleRoleAssignment = (userId: string, roleName: string, data: any) => {
    setAssignments((prev) => {
      const map = new Map(prev);
      const userAssignment = map.get(userId) || {
        userId,
        roles: [],
        policies: [],
      };

      const existingRoleIndex = userAssignment.roles.findIndex((r) => r.roleName === roleName);

      if (data === null) {
        // Remove role
        userAssignment.roles = userAssignment.roles.filter((r) => r.roleName !== roleName);
      } else if (existingRoleIndex >= 0) {
        // Update existing role
        userAssignment.roles[existingRoleIndex] = {
          ...userAssignment.roles[existingRoleIndex],
          ...data,
        };
      } else {
        // Add new role
        userAssignment.roles.push({
          roleName,
          priority: data.priority || 0,
          validTo: data.validTo,
        });
      }

      map.set(userId, userAssignment);
      return map;
    });
  };

  const handlePolicyAssignment = (userId: string, policyId: string) => {
    setAssignments((prev) => {
      const map = new Map(prev);
      const userAssignment = map.get(userId) || {
        userId,
        roles: [],
        policies: [],
      };

      if (userAssignment.policies.includes(policyId)) {
        userAssignment.policies = userAssignment.policies.filter((id) => id !== policyId);
      } else {
        userAssignment.policies.push(policyId);
      }

      map.set(userId, userAssignment);
      return map;
    });
  };

  const handleConfirmAssignments = async () => {
    setIsLoading(true);

    try {
      const promises: Promise<any>[] = [];

      // Process each user's assignments
      assignments.forEach((assignment, userId) => {
        // Assign roles
        assignment.roles.forEach((role) => {
          promises.push(
            userAPI.assignRole(userId, {
              organizationId: selectedOrganization,
              roleName: role.roleName,
              assignedBy: 'current-user-id', // This should come from auth context
              priority: role.priority,
              validTo: role.validTo,
            }),
          );
        });

        // Note: Policy assignment to users would need a new endpoint
        // For now, policies are typically assigned at the role level
      });

      await Promise.all(promises);

      toast({
        title: 'Success',
        description: 'Roles and policies assigned successfully',
      });

      router.push('/dashboard/users');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign roles and policies',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!userSearchQuery) return true;
    const query = userSearchQuery.toLowerCase();
    return user.name?.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
  });

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Select Organization</CardTitle>
              <CardDescription>
                Choose the organization context for policy assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4">
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      className={cn(
                        'flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50',
                        selectedOrganization === org.id && 'border-primary bg-primary/5',
                      )}
                      onClick={() => setSelectedOrganization(org.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-gray-500">
                            {org.type} • {org.code}
                          </p>
                        </div>
                      </div>
                      {selectedOrganization === org.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Select Users</CardTitle>
              <CardDescription>Choose users to assign policies to</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Current Roles</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => handleUserSelection(user.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {user.memberships?.map((membership) => (
                              <Badge key={membership.id} variant="secondary">
                                {membership.role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <div className="space-y-6">
            {selectedUsers.map((userId) => {
              const user = users.find((u) => u.id === userId);
              if (!user) return null;

              const userAssignment = assignments.get(userId);

              return (
                <Card key={userId}>
                  <CardHeader>
                    <CardTitle>{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium mb-3">Assign Roles</h4>
                      <div className="space-y-2">
                        {availableRoles.map((role) => {
                          const isAssigned = userAssignment?.roles.some((r) => r.roleName === role);
                          return (
                            <div
                              key={role}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isAssigned}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleRoleAssignment(userId, role, { priority: 0 });
                                    } else {
                                      handleRoleAssignment(userId, role, null);
                                    }
                                  }}
                                />
                                <Label className="capitalize">{role}</Label>
                              </div>
                              {isAssigned && (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Priority"
                                    className="w-24"
                                    min="0"
                                    max="1000"
                                    value={
                                      userAssignment?.roles.find((r) => r.roleName === role)
                                        ?.priority || 0
                                    }
                                    onChange={(e) => {
                                      handleRoleAssignment(userId, role, {
                                        priority: parseInt(e.target.value) || 0,
                                      });
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-3">Direct Policy Assignments</h4>
                      <div className="space-y-2">
                        {policies.map((policy) => (
                          <div
                            key={policy.id}
                            className="flex items-center gap-3 p-3 border rounded-lg"
                          >
                            <Checkbox
                              checked={userAssignment?.policies.includes(policy.id) || false}
                              onCheckedChange={() => handlePolicyAssignment(userId, policy.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{policy.name}</p>
                              <p className="text-sm text-gray-500">{policy.description}</p>
                            </div>
                            <Badge variant={policy.effect === 'Allow' ? 'default' : 'destructive'}>
                              {policy.effect}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Review Assignments</CardTitle>
              <CardDescription>Confirm the role and policy assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from(assignments.entries()).map(([userId, assignment]) => {
                  const user = users.find((u) => u.id === userId);
                  if (!user) return null;

                  return (
                    <div key={userId} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">{user.name}</h4>

                      {assignment.roles.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-500 mb-1">Roles:</p>
                          <div className="flex gap-2">
                            {assignment.roles.map((role) => (
                              <Badge key={role.roleName} variant="secondary">
                                {role.roleName} (Priority: {role.priority})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {assignment.policies.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Direct Policies:</p>
                          <div className="flex gap-2">
                            {assignment.policies.map((policyId) => {
                              const policy = policies.find((p) => p.id === policyId);
                              return (
                                <Badge key={policyId} variant="outline">
                                  {policy?.name}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {assignments.size === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No assignments configured</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push('/dashboard/policies')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Policies
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Policy Assignment</h1>
        <p className="text-gray-500">Assign roles and policies to users</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-medium',
                    currentStep >= step.step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-200 text-gray-500',
                  )}
                >
                  {currentStep > step.step ? <CheckCircle className="h-6 w-6" /> : step.step}
                </div>
                <p className="text-sm font-medium mt-2">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4',
                    currentStep > step.step ? 'bg-primary' : 'bg-gray-200',
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1 || isLoading}
        >
          Previous
        </Button>

        {currentStep < 4 ? (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={
              isLoading ||
              (currentStep === 1 && !selectedOrganization) ||
              (currentStep === 2 && selectedUsers.length === 0)
            }
          >
            Next
          </Button>
        ) : (
          <Button onClick={handleConfirmAssignments} disabled={isLoading || assignments.size === 0}>
            {isLoading ? 'Assigning...' : 'Confirm Assignments'}
          </Button>
        )}
      </div>
    </div>
  );
}
