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
import { territoryAPI } from '@/lib/api';
import { Territory, PaginationParams } from '@saas-template/shared';
import {
  Search,
  Plus,
  MapPin,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Map,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const territoryTypeLabels = {
  zipcode: 'ZIP Code',
  city: 'City',
  county: 'County',
  state: 'State',
  region: 'Region',
};

const territoryTypeColors = {
  zipcode: 'bg-blue-100 text-blue-800',
  city: 'bg-green-100 text-green-800',
  county: 'bg-yellow-100 text-yellow-800',
  state: 'bg-purple-100 text-purple-800',
  region: 'bg-pink-100 text-pink-800',
};

export default function TerritoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchTerritories();
  }, [pagination.page, selectedType]);

  const fetchTerritories = async () => {
    setIsLoading(true);
    try {
      const params: PaginationParams & any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (selectedType) params.type = selectedType;

      const response = await territoryAPI.getAll(params);
      setTerritories(response.data.items);
      setPagination({
        ...pagination,
        total: response.data.total,
        totalPages: response.data.totalPages,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch territories',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTerritory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this territory? This action cannot be undone.'))
      return;

    try {
      await territoryAPI.delete(id);
      toast({
        title: 'Success',
        description: 'Territory deleted successfully',
      });
      fetchTerritories();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete territory',
        variant: 'destructive',
      });
    }
  };

  const filteredTerritories = territories.filter((territory) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      territory.name.toLowerCase().includes(query) || territory.code.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Territories</h1>
        <p className="text-gray-500">Manage geographic territories for insurance operations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Territory Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/dashboard/territories/hierarchy')}
            >
              <Map className="mr-2 h-4 w-4" />
              View Territory Hierarchy
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-sm text-gray-500">Total Territories</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Territory List</CardTitle>
            <Button onClick={() => router.push('/dashboard/territories/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Territory
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {Object.entries(territoryTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Territory</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Parent Territory</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredTerritories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No territories found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTerritories.map((territory) => (
                    <TableRow key={territory.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium">{territory.name}</div>
                            {territory.metadata?.population && (
                              <div className="text-sm text-gray-500">
                                Population: {territory.metadata.population.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            territoryTypeColors[territory.type as keyof typeof territoryTypeColors]
                          }
                        >
                          {territoryTypeLabels[territory.type as keyof typeof territoryTypeLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {territory.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        {territory.parentTerritory ? (
                          <div className="flex items-center gap-2">
                            <span>{territory.parentTerritory.name}</span>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        ) : (
                          <span className="text-gray-400">None (Root)</span>
                        )}
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
                              onClick={() => router.push(`/dashboard/territories/${territory.id}`)}
                            >
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/dashboard/territories/${territory.id}/edit`)
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteTerritory(territory.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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
