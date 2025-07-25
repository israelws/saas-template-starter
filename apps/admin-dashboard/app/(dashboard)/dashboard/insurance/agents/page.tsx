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
import { insuranceAgentAPI } from '@/lib/api';
import {
  InsuranceAgent,
  LicenseStatus,
  InsuranceType,
  PaginationParams,
} from '@saas-template/shared';
import {
  Search,
  Plus,
  User,
  Building,
  Calendar,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  MapPin,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

const licenseStatusColors: Record<LicenseStatus, string> = {
  [LicenseStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [LicenseStatus.EXPIRED]: 'bg-red-100 text-red-800',
  [LicenseStatus.SUSPENDED]: 'bg-yellow-100 text-yellow-800',
  [LicenseStatus.PENDING]: 'bg-gray-100 text-gray-800',
};

export default function InsuranceAgentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [agents, setAgents] = useState<InsuranceAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchAgents();
  }, [pagination.page, selectedBranch, selectedStatus]);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const params: PaginationParams & any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (selectedBranch && selectedBranch !== 'all') params.branchId = selectedBranch;
      if (selectedStatus && selectedStatus !== 'all') params.licenseStatus = selectedStatus;

      const response = await insuranceAgentAPI.getAll(params);
      setAgents(response.data.items);
      setPagination({
        ...pagination,
        total: response.data.total,
        totalPages: response.data.totalPages,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch insurance agents',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this agent?')) return;

    try {
      await insuranceAgentAPI.delete(id);
      toast({
        title: 'Success',
        description: 'Agent deactivated successfully',
      });
      fetchAgents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate agent',
        variant: 'destructive',
      });
    }
  };

  const getInsuranceTypeLabel = (types: InsuranceType[]): string => {
    if (!types || types.length === 0) return 'None';
    if (types.length === 1) return types[0];
    return `${types[0]} +${types.length - 1}`;
  };

  const filteredAgents = agents.filter((agent) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      agent.agentCode.toLowerCase().includes(query) ||
      agent.licenseNumber.toLowerCase().includes(query) ||
      agent.user?.name?.toLowerCase().includes(query) ||
      agent.user?.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Insurance Agents</h1>
        <p className="text-gray-500">Manage insurance agents and their licenses</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Agent List</CardTitle>
            <Button onClick={() => router.push('/dashboard/insurance/agents/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Agent
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, email, code, or license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(LicenseStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Specializations</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : filteredAgents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No agents found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium">{agent.user?.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{agent.agentCode}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{agent.licenseNumber}</div>
                          <div className="text-sm text-gray-500">
                            Expires: {format(new Date(agent.licenseExpiryDate), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span>{agent.branch?.branchName || 'Unassigned'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {agent.specializations?.map((spec) => (
                            <Badge key={spec} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          )) || <span className="text-gray-400">None</span>}
                        </div>
                      </TableCell>
                      <TableCell>{agent.commissionRate}%</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={licenseStatusColors[agent.licenseStatus]}
                        >
                          {agent.licenseStatus}
                        </Badge>
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
                              onClick={() => router.push(`/dashboard/insurance/agents/${agent.id}`)}
                            >
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/dashboard/insurance/agents/${agent.id}/edit`)
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
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
