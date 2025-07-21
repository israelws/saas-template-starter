'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { 
  FileSearch, 
  Shield, 
  User, 
  Calendar as CalendarIcon,
  Filter,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface FieldAccessLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'read' | 'write' | 'denied';
  resourceType: string;
  resourceId: string;
  fields: string[];
  deniedFields?: string[];
  organizationId: string;
  organizationName: string;
  ipAddress: string;
  userAgent: string;
  requestId: string;
}

export function FieldAccessAuditLog() {
  const { toast } = useToast();
  const organizationId = useAppSelector(state => state.organization.currentOrganization?.id);
  
  const [logs, setLogs] = useState<FieldAccessLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    userId: '',
    resourceType: '',
    action: '',
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
    searchTerm: '',
  });
  const [selectedLog, setSelectedLog] = useState<FieldAccessLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [organizationId]);

  const fetchLogs = async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      // In a real implementation, this would call an actual API endpoint
      // For now, we'll simulate with mock data
      const mockLogs: FieldAccessLog[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          userId: 'user-123',
          userName: 'John Doe',
          action: 'read',
          resourceType: 'Customer',
          resourceId: 'cust-456',
          fields: ['name', 'email', 'phone'],
          organizationId,
          organizationName: 'Main Organization',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          requestId: 'req-789',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          userId: 'user-456',
          userName: 'Jane Smith',
          action: 'denied',
          resourceType: 'Customer',
          resourceId: 'cust-789',
          fields: [],
          deniedFields: ['ssn', 'creditScore'],
          organizationId,
          organizationName: 'Main Organization',
          ipAddress: '192.168.1.2',
          userAgent: 'Chrome/91.0...',
          requestId: 'req-012',
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          userId: 'user-789',
          userName: 'Bob Johnson',
          action: 'write',
          resourceType: 'Product',
          resourceId: 'prod-123',
          fields: ['name', 'price', 'description'],
          organizationId,
          organizationName: 'Main Organization',
          ipAddress: '192.168.1.3',
          userAgent: 'Firefox/89.0...',
          requestId: 'req-345',
        },
      ];
      
      setLogs(mockLogs);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // In a real implementation, this would export to CSV
    toast({
      title: 'Export started',
      description: 'Your audit log export will be ready shortly',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'read':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'write':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'denied':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'read':
        return <Eye className="h-3 w-3" />;
      case 'write':
        return <FileSearch className="h-3 w-3" />;
      case 'denied':
        return <EyeOff className="h-3 w-3" />;
      default:
        return <Shield className="h-3 w-3" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filters.userId && !log.userId.includes(filters.userId)) return false;
    if (filters.resourceType && log.resourceType !== filters.resourceType) return false;
    if (filters.action && log.action !== filters.action) return false;
    if (filters.searchTerm && 
        !log.userName.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
        !log.resourceId.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    const logDate = new Date(log.timestamp);
    if (logDate < filters.startDate || logDate > filters.endDate) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter audit logs by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search by user or resource..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Resource Type</Label>
              <Select
                value={filters.resourceType}
                onValueChange={(value) => setFilters({ ...filters, resourceType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All resources</SelectItem>
                  <SelectItem value="Customer">Customer</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Order">Order</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Action</Label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="write">Write</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(filters.startDate, 'MMM d')} - {format(filters.endDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => date && setFilters({ ...filters, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={fetchLogs} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Field Access Logs</CardTitle>
          <CardDescription>
            Detailed log of all field-level access attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No audit logs found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters or date range
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{log.userName}</div>
                          <div className="text-xs text-muted-foreground">{log.userId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('flex items-center gap-1 w-fit', getActionColor(log.action))}>
                        {getActionIcon(log.action)}
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.resourceType}</div>
                        <div className="text-xs text-muted-foreground">{log.resourceId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.action === 'denied' && log.deniedFields ? (
                        <div className="flex flex-wrap gap-1">
                          {log.deniedFields.slice(0, 3).map(field => (
                            <Badge key={field} variant="destructive" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                          {log.deniedFields.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{log.deniedFields.length - 3} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {log.fields.slice(0, 3).map(field => (
                            <Badge key={field} variant="secondary" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                          {log.fields.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{log.fields.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.ipAddress}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Audit Log Details</CardTitle>
              <CardDescription>
                Request ID: {selectedLog.requestId}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>User</Label>
                  <p className="text-sm">{selectedLog.userName} ({selectedLog.userId})</p>
                </div>
                <div>
                  <Label>Timestamp</Label>
                  <p className="text-sm">{format(new Date(selectedLog.timestamp), 'PPpp')}</p>
                </div>
                <div>
                  <Label>Action</Label>
                  <Badge className={getActionColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <Label>Resource</Label>
                  <p className="text-sm">{selectedLog.resourceType} - {selectedLog.resourceId}</p>
                </div>
                <div>
                  <Label>Organization</Label>
                  <p className="text-sm">{selectedLog.organizationName}</p>
                </div>
                <div>
                  <Label>IP Address</Label>
                  <p className="text-sm font-mono">{selectedLog.ipAddress}</p>
                </div>
              </div>

              <div>
                <Label>User Agent</Label>
                <p className="text-sm font-mono text-muted-foreground">{selectedLog.userAgent}</p>
              </div>

              {selectedLog.action === 'denied' && selectedLog.deniedFields ? (
                <div>
                  <Label>Denied Fields</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedLog.deniedFields.map(field => (
                      <Badge key={field} variant="destructive">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <Label>Accessed Fields</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedLog.fields.map(field => (
                      <Badge key={field} variant="secondary">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}