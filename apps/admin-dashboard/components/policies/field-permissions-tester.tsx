'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { 
  TestTube, 
  Shield, 
  Eye, 
  EyeOff, 
  Edit, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  FileJson,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldPermissionsTest {
  resourceType: string;
  resourceId?: string;
  userId: string;
  action: 'read' | 'write';
}

interface TestResult {
  allowed: boolean;
  readableFields?: string[];
  writableFields?: string[];
  deniedFields?: string[];
  fieldPermissions?: any;
  sampleData?: any;
  filteredData?: any;
}

const SAMPLE_DATA = {
  Customer: {
    id: 'cust-123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0123',
    ssn: '123-45-6789',
    dateOfBirth: '1980-01-15',
    creditScore: 750,
    income: 85000,
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '12345'
    },
    internalNotes: 'VIP customer, handle with care',
    riskScore: 3.5,
  },
  Product: {
    id: 'prod-456',
    name: 'Premium Insurance Package',
    description: 'Comprehensive coverage for all your needs',
    price: 199.99,
    costPrice: 120.00,
    profitMargin: 0.4,
    sku: 'INS-PREM-001',
    category: 'Insurance',
    supplierNotes: 'Negotiate better rates in Q2',
    inStock: true,
    quantity: 100,
  },
  User: {
    id: 'user-789',
    name: 'Jane Smith',
    email: 'jane@company.com',
    role: 'agent',
    department: 'Sales',
    salary: 65000,
    performanceRating: 4.2,
    password: 'hashed_password_here',
    mfaSecret: 'secret_key',
    lastLogin: '2024-01-20T10:30:00Z',
  },
};

export function FieldPermissionsTester() {
  const { toast } = useToast();
  const organizationId = useAppSelector(state => state.organization.currentOrganization?.id);
  const [loading, setLoading] = useState(false);
  
  // Test configuration
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedResource, setSelectedResource] = useState('Customer');
  const [testAction, setTestAction] = useState<'read' | 'write'>('read');
  const [customData, setCustomData] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleRunTest = async () => {
    if (!selectedUser || !organizationId) {
      toast({
        title: 'Missing information',
        description: 'Please select a user and ensure you have an organization selected',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // First, get field permissions for the user
      const response = await api.get(`/products/test-field-permissions`, {
        params: {
          userId: selectedUser,
          organizationId,
          resourceType: selectedResource,
          action: testAction,
        },
      });

      const permissions = response.data;
      
      // Apply field filtering to sample data
      const sampleData = customData 
        ? JSON.parse(customData) 
        : SAMPLE_DATA[selectedResource] || {};
      
      const filteredData = applyFieldFiltering(
        sampleData,
        permissions.readableFields || [],
        permissions.deniedFields || []
      );

      setTestResult({
        ...permissions,
        sampleData,
        filteredData,
      });

      toast({
        title: 'Test completed',
        description: 'Field permissions have been evaluated',
      });
    } catch (error: any) {
      toast({
        title: 'Test failed',
        description: error.response?.data?.message || 'Failed to run field permissions test',
        variant: 'destructive',
      });
      setTestResult(null);
    } finally {
      setLoading(false);
    }
  };

  const applyFieldFiltering = (
    data: any,
    readableFields: string[],
    deniedFields: string[]
  ): any => {
    if (!data || typeof data !== 'object') return data;

    const deniedSet = new Set(deniedFields);
    const result: any = {};

    // If readable fields are specified, only include those
    if (readableFields.length > 0 && !readableFields.includes('*')) {
      for (const field of readableFields) {
        if (!deniedSet.has(field) && field in data) {
          result[field] = data[field];
        }
      }
    } else {
      // Otherwise include all fields except denied
      for (const [key, value] of Object.entries(data)) {
        if (!deniedSet.has(key)) {
          result[key] = value;
        }
      }
    }

    return result;
  };

  const renderFieldStatus = (field: string, data: any) => {
    const isDenied = testResult?.deniedFields?.includes(field);
    const isReadable = testResult?.readableFields?.includes(field) || 
                      testResult?.readableFields?.includes('*');
    const isWritable = testResult?.writableFields?.includes(field) ||
                      testResult?.writableFields?.includes('*');
    const isInFilteredData = testResult?.filteredData && field in testResult.filteredData;

    return (
      <div
        key={field}
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border',
          isDenied && 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
          !isDenied && isInFilteredData && 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
          !isDenied && !isInFilteredData && 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800'
        )}
      >
        <div className="flex items-center gap-3">
          <div>
            {isDenied ? (
              <EyeOff className="h-5 w-5 text-red-600" />
            ) : isInFilteredData ? (
              <Eye className="h-5 w-5 text-green-600" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <div className="font-medium">{field}</div>
            <div className="text-sm text-muted-foreground">
              {typeof data[field] === 'object' 
                ? JSON.stringify(data[field]) 
                : String(data[field])}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDenied && (
            <Badge variant="destructive" className="text-xs">
              <XCircle className="h-3 w-3 mr-1" />
              Denied
            </Badge>
          )}
          {!isDenied && isReadable && (
            <Badge variant="outline" className="text-xs border-green-500 text-green-600">
              <Eye className="h-3 w-3 mr-1" />
              Read
            </Badge>
          )}
          {!isDenied && isWritable && (
            <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
              <Edit className="h-3 w-3 mr-1" />
              Write
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Field Permissions Tester
        </CardTitle>
        <CardDescription>
          Test how field-level permissions affect data visibility for different users and resources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Configuration */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Test User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user-agent">Agent User</SelectItem>
                <SelectItem value="user-manager">Manager User</SelectItem>
                <SelectItem value="user-customer">Customer User</SelectItem>
                <SelectItem value="user-admin">Admin User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Resource Type</Label>
            <Select value={selectedResource} onValueChange={setSelectedResource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Customer">Customer</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="InsurancePolicy">Insurance Policy</SelectItem>
                <SelectItem value="Order">Order</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={testAction} onValueChange={(v) => setTestAction(v as 'read' | 'write')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="write">Write</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Data Input */}
        <div className="space-y-2">
          <Label>Test Data (Optional - Leave empty to use sample data)</Label>
          <Textarea
            placeholder={`Paste JSON data or leave empty to use sample ${selectedResource} data`}
            value={customData}
            onChange={(e) => setCustomData(e.target.value)}
            className="font-mono text-sm"
            rows={6}
          />
        </div>

        {/* Run Test Button */}
        <Button 
          onClick={handleRunTest} 
          disabled={loading || !selectedUser}
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          {loading ? 'Running Test...' : 'Run Field Permissions Test'}
        </Button>

        {/* Test Results */}
        {testResult && (
          <div className="space-y-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Test Results
              </h3>
              <Badge variant={testResult.allowed ? 'default' : 'destructive'}>
                {testResult.allowed ? 'Access Allowed' : 'Access Denied'}
              </Badge>
            </div>

            {testResult.allowed && (
              <Tabs defaultValue="comparison" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="comparison">Field Comparison</TabsTrigger>
                  <TabsTrigger value="original">Original Data</TabsTrigger>
                  <TabsTrigger value="filtered">Filtered Data</TabsTrigger>
                </TabsList>

                <TabsContent value="comparison" className="space-y-3">
                  <div className="space-y-2">
                    {Object.keys(testResult.sampleData).map(field => 
                      renderFieldStatus(field, testResult.sampleData)
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="original" className="space-y-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileJson className="h-4 w-4" />
                        Original Data (Before Filtering)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-sm overflow-x-auto p-4 bg-muted rounded-lg">
                        {JSON.stringify(testResult.sampleData, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="filtered" className="space-y-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileJson className="h-4 w-4" />
                        Filtered Data (After Field Permissions)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-sm overflow-x-auto p-4 bg-muted rounded-lg">
                        {JSON.stringify(testResult.filteredData, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {/* Permission Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4 text-green-600" />
                    Readable Fields
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {(testResult.readableFields || []).map(field => (
                      <Badge key={field} variant="outline" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                    {(!testResult.readableFields || testResult.readableFields.length === 0) && (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Edit className="h-4 w-4 text-blue-600" />
                    Writable Fields
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {(testResult.writableFields || []).map(field => (
                      <Badge key={field} variant="outline" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                    {(!testResult.writableFields || testResult.writableFields.length === 0) && (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-red-600" />
                    Denied Fields
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {(testResult.deniedFields || []).map(field => (
                      <Badge key={field} variant="destructive" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                    {(!testResult.deniedFields || testResult.deniedFields.length === 0) && (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}