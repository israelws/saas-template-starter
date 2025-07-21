'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FieldPermissionsEditor } from '@/components/policies/field-permissions-editor';
import { FieldPermissionsTester } from '@/components/policies/field-permissions-tester';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, TestTube, FileText, AlertCircle } from 'lucide-react';

export default function FieldPermissionsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Field-Level Permissions</h1>
        <p className="text-muted-foreground mt-2">
          Configure and test fine-grained field access control for your resources
        </p>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            About Field-Level Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>
              Field-level permissions allow you to control which specific fields within a resource 
              users can read or write. This provides granular access control for sensitive data.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Readable fields:</strong> Fields the user can view in API responses</li>
              <li><strong>Writable fields:</strong> Fields the user can include in create/update requests</li>
              <li><strong>Denied fields:</strong> Fields explicitly blocked (overrides readable/writable)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="configure" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="configure" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Configure
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Examples
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="space-y-6">
          <FieldPermissionsEditor
            onChange={(value) => console.log('Field permissions updated:', value)}
          />
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <FieldPermissionsTester />
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <div className="grid gap-6">
            {/* Example: Insurance Agent */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Insurance Agent Example</CardTitle>
                <CardDescription>
                  Agents can view customer information but not sensitive financial data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm overflow-x-auto p-4 bg-muted rounded-lg">
{`{
  "Customer": {
    "readable": ["id", "name", "email", "phone", "policyNumbers"],
    "writable": ["phone", "email", "notes"],
    "denied": ["ssn", "dateOfBirth", "medicalHistory", "creditScore", "income"]
  },
  "InsurancePolicy": {
    "readable": ["*"],
    "denied": ["profitMargin", "internalNotes", "commissionStructure"]
  }
}`}
                </pre>
              </CardContent>
            </Card>

            {/* Example: Customer Self-Service */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Self-Service Example</CardTitle>
                <CardDescription>
                  Customers can only see and update their own limited information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm overflow-x-auto p-4 bg-muted rounded-lg">
{`{
  "Customer": {
    "readable": ["*"],
    "writable": ["email", "phone", "mailingAddress", "preferences"],
    "denied": ["id", "customerId", "internalNotes", "riskScore", "creditScore"]
  },
  "InsurancePolicy": {
    "readable": ["policyNumber", "type", "premium", "coverage", "startDate", "endDate"],
    "denied": ["profitMargin", "agentCommission", "internalNotes"]
  }
}`}
                </pre>
              </CardContent>
            </Card>

            {/* Example: Auditor Read-Only */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Auditor Read-Only Example</CardTitle>
                <CardDescription>
                  Auditors can read everything but cannot modify any data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm overflow-x-auto p-4 bg-muted rounded-lg">
{`{
  "*": {
    "readable": ["*"],
    "writable": [],
    "denied": []
  }
}`}
                </pre>
              </CardContent>
            </Card>

            {/* Best Practices */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Best Practices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">1. Start Restrictive</h4>
                  <p className="text-sm text-muted-foreground">
                    Begin with minimal permissions and add fields as needed. It's easier to grant 
                    access than to revoke it later.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">2. Use Explicit Denials for Sensitive Fields</h4>
                  <p className="text-sm text-muted-foreground">
                    Always explicitly deny sensitive fields like SSN, passwords, and financial data 
                    to ensure they're never accidentally exposed.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">3. Document Your Fields</h4>
                  <p className="text-sm text-muted-foreground">
                    Maintain a data dictionary that clearly identifies which fields contain 
                    sensitive information and why.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">4. Test Thoroughly</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the testing tool to verify that field permissions work as expected 
                    before deploying to production.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">5. Regular Audits</h4>
                  <p className="text-sm text-muted-foreground">
                    Periodically review field permissions to ensure they still align with 
                    your security requirements and compliance needs.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}