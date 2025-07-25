'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { insuranceBranchAPI, organizationAPI } from '@/lib/api';
import {
  InsuranceBranch,
  Organization,
  OrganizationType,
  PaginationParams,
  InsuranceType,
} from '@saas-template/shared';
import {
  Search,
  Plus,
  Building2,
  MapPin,
  Clock,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Phone,
  Mail,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const insuranceTypeLabels: Record<InsuranceType, string> = {
  [InsuranceType.LIFE]: 'Life',
  [InsuranceType.HEALTH]: 'Health',
  [InsuranceType.PROPERTY]: 'Property',
  [InsuranceType.CASUALTY]: 'Casualty',
  [InsuranceType.AUTO]: 'Auto',
  [InsuranceType.DISABILITY]: 'Disability',
  [InsuranceType.LONG_TERM_CARE]: 'LTC',
  [InsuranceType.BUSINESS]: 'Business',
};

export default function InsuranceBranchesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [branches, setBranches] = useState<InsuranceBranch[]>([]);
  const [agencies, setAgencies] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgency, setSelectedAgency] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadAgencies();
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [pagination.page, selectedAgency]);

  const loadAgencies = async () => {
    try {
      const response = await organizationAPI.getAll();
      const insuranceAgencies = response.data.items.filter(
        (org: Organization) => org.type === OrganizationType.INSURANCE_AGENCY,
      );
      setAgencies(insuranceAgencies);
    } catch (error) {
      console.error('Failed to load agencies:', error);
    }
  };

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const params: PaginationParams & any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (selectedAgency) {
        // Get branches for specific agency
        const response = await insuranceBranchAPI.getByAgency(selectedAgency);
        setBranches(response.data);
        setPagination({
          ...pagination,
          total: response.data.length,
          totalPages: Math.ceil(response.data.length / pagination.limit),
        });
      } else {
        // Get all branches
        const response = await insuranceBranchAPI.getAll(params);
        setBranches(response.data.items);
        setPagination({
          ...pagination,
          total: response.data.total,
          totalPages: response.data.totalPages,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch insurance branches',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this branch?')) return;

    try {
      await insuranceBranchAPI.delete(id);
      toast({
        title: 'Success',
        description: 'Branch deactivated successfully',
      });
      fetchBranches();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate branch',
        variant: 'destructive',
      });
    }
  };

  const getOperatingStatus = (branch: InsuranceBranch) => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const currentTime = now.toTimeString().slice(0, 5);

    const todayHours = branch.operatingHours[currentDay as keyof typeof branch.operatingHours];

    if (!todayHours || todayHours.isClosed) {
      return { isOpen: false, text: 'Closed' };
    }

    if (currentTime >= todayHours.open && currentTime <= todayHours.close) {
      return { isOpen: true, text: `Open until ${todayHours.close}` };
    }

    return { isOpen: false, text: 'Closed' };
  };

  const filteredBranches = branches.filter((branch) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      branch.branchName.toLowerCase().includes(query) ||
      branch.branchCode.toLowerCase().includes(query) ||
      branch.email.toLowerCase().includes(query) ||
      branch.phoneNumber.includes(query) ||
      branch.address.city.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Insurance Branches</h1>
        <p className="text-gray-500">Manage insurance branch locations and details</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Branch List</CardTitle>
            <Button onClick={() => router.push('/dashboard/insurance/branches/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Branch
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, code, email, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedAgency} onValueChange={setSelectedAgency}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="All Agencies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Agencies</SelectItem>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Service Types</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Statistics</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredBranches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No branches found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBranches.map((branch) => {
                    const operatingStatus = getOperatingStatus(branch);
                    return (
                      <TableRow key={branch.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium">{branch.branchName}</div>
                              <div className="text-sm text-gray-500">{branch.branchCode}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <div className="text-sm">{branch.address.street}</div>
                              <div className="text-sm text-gray-500">
                                {branch.address.city}, {branch.address.state}{' '}
                                {branch.address.postalCode}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {branch.phoneNumber}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {branch.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {branch.serviceTypes.slice(0, 3).map((type) => (
                              <Badge key={type} variant="secondary" className="text-xs">
                                {insuranceTypeLabels[type]}
                              </Badge>
                            ))}
                            {branch.serviceTypes.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{branch.serviceTypes.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              variant={branch.isActive ? 'default' : 'secondary'}
                              className={branch.isActive ? 'bg-green-100 text-green-800' : ''}
                            >
                              {branch.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span
                                className={
                                  operatingStatus.isOpen ? 'text-green-600' : 'text-gray-500'
                                }
                              >
                                {operatingStatus.text}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>{branch.agents?.length || 0} agents</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/insurance/branches/${branch.id}`)
                                }
                              >
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/insurance/branches/${branch.id}/edit`)
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/insurance/branches/${branch.id}/agents`)
                                }
                              >
                                <Users className="mr-2 h-4 w-4" />
                                Manage Agents
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteBranch(branch.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
