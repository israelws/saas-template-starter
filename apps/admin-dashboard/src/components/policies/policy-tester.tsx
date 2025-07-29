'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Plus, Trash2, CheckCircle, XCircle, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Policy } from '@saas-template/shared';

interface TestAttribute {
  key: string;
  value: string | number | boolean;
}

interface TestContext {
  subject: TestAttribute[];
  resource: TestAttribute[];
  environment: TestAttribute[];
  action: string;
  resourcePath: string;
}

interface PolicyTestResult {
  allowed: boolean;
  matchedPolicies: Policy[];
  evaluationPath: Array<{
    policy: Policy;
    matched: boolean;
    reason: string;
  }>;
  finalEffect: 'allow' | 'deny';
}

interface PolicyTesterProps {
  policies?: Policy[];
  onTest?: (context: TestContext) => Promise<PolicyTestResult>;
  availableAttributes?: Array<{
    key: string;
    name: string;
    type: string;
    category: 'subject' | 'resource' | 'environment';
  }>;
}

const DEFAULT_ATTRIBUTES = {
  subject: [
    { key: 'subject.id', name: 'User ID', type: 'string' },
    { key: 'subject.role', name: 'Role', type: 'string' },
    { key: 'subject.department', name: 'Department', type: 'string' },
    { key: 'subject.clearanceLevel', name: 'Clearance Level', type: 'string' },
  ],
  resource: [
    { key: 'resource.id', name: 'Resource ID', type: 'string' },
    { key: 'resource.type', name: 'Resource Type', type: 'string' },
    { key: 'resource.owner', name: 'Owner', type: 'string' },
    { key: 'resource.status', name: 'Status', type: 'string' },
  ],
  environment: [
    { key: 'environment.time', name: 'Time', type: 'string' },
    { key: 'environment.ip', name: 'IP Address', type: 'string' },
    { key: 'environment.location', name: 'Location', type: 'string' },
  ],
};

export const PolicyTester: React.FC<PolicyTesterProps> = ({
  policies = [],
  onTest,
  availableAttributes,
}) => {
  const [testContext, setTestContext] = useState<TestContext>({
    subject: [],
    resource: [],
    environment: [],
    action: '',
    resourcePath: '',
  });
  const [testResult, setTestResult] = useState<PolicyTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const categorizedAttributes = React.useMemo(() => {
    if (availableAttributes) {
      return {
        subject: availableAttributes.filter((a) => a.category === 'subject'),
        resource: availableAttributes.filter((a) => a.category === 'resource'),
        environment: availableAttributes.filter((a) => a.category === 'environment'),
      };
    }
    return DEFAULT_ATTRIBUTES;
  }, [availableAttributes]);

  const addAttribute = (category: 'subject' | 'resource' | 'environment') => {
    setTestContext((prev) => ({
      ...prev,
      [category]: [...prev[category], { key: '', value: '' }],
    }));
  };

  const updateAttribute = (
    category: 'subject' | 'resource' | 'environment',
    index: number,
    field: 'key' | 'value',
    value: string,
  ) => {
    setTestContext((prev) => ({
      ...prev,
      [category]: prev[category].map((attr, i) =>
        i === index ? { ...attr, [field]: value } : attr,
      ),
    }));
  };

  const removeAttribute = (category: 'subject' | 'resource' | 'environment', index: number) => {
    setTestContext((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const runTest = async () => {
    if (!testContext.action || !testContext.resourcePath) {
      return;
    }

    setIsLoading(true);
    try {
      if (onTest) {
        const result = await onTest(testContext);
        setTestResult(result);
      } else {
        // Simulate test result
        setTestResult({
          allowed: Math.random() > 0.5,
          matchedPolicies: policies.slice(0, 2),
          evaluationPath: policies.slice(0, 3).map((p) => ({
            policy: p,
            matched: Math.random() > 0.5,
            reason: 'Condition evaluation result',
          })),
          finalEffect: Math.random() > 0.5 ? 'allow' : 'deny',
        });
      }
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportTestCase = () => {
    const testCase = {
      name: `Test Case - ${new Date().toISOString()}`,
      context: testContext,
      expectedResult: testResult?.allowed,
    };
    const blob = new Blob([JSON.stringify(testCase, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'policy-test-case.json';
    a.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Policy Test Context</CardTitle>
          <CardDescription>Define the context to test against your policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="resource">Resource Path</Label>
              <Input
                id="resource"
                value={testContext.resourcePath}
                onChange={(e) =>
                  setTestContext((prev) => ({ ...prev, resourcePath: e.target.value }))
                }
                placeholder="e.g., organization:read"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Input
                id="action"
                value={testContext.action}
                onChange={(e) => setTestContext((prev) => ({ ...prev, action: e.target.value }))}
                placeholder="e.g., read, write, delete"
              />
            </div>
          </div>

          <Tabs defaultValue="subject" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="subject">Subject ({testContext.subject.length})</TabsTrigger>
              <TabsTrigger value="resource">Resource ({testContext.resource.length})</TabsTrigger>
              <TabsTrigger value="environment">
                Environment ({testContext.environment.length})
              </TabsTrigger>
            </TabsList>

            {(['subject', 'resource', 'environment'] as const).map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Define {category} attributes for the test context
                  </p>
                  <Button onClick={() => addAttribute(category)} size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Attribute
                  </Button>
                </div>

                {testContext[category].length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No {category} attributes defined
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {testContext[category].map((attr, index) => (
                      <div key={index} className="flex gap-3">
                        <Select
                          value={attr.key}
                          onValueChange={(value) => updateAttribute(category, index, 'key', value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select attribute" />
                          </SelectTrigger>
                          <SelectContent>
                            {categorizedAttributes[category].map((availAttr) => (
                              <SelectItem key={availAttr.key} value={availAttr.key}>
                                {availAttr.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={String(attr.value)}
                          onChange={(e) =>
                            updateAttribute(category, index, 'value', e.target.value)
                          }
                          placeholder="Value"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttribute(category, index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex justify-end">
            <Button
              onClick={runTest}
              disabled={isLoading || !testContext.action || !testContext.resourcePath}
            >
              <Play className="mr-2 h-4 w-4" />
              {isLoading ? 'Running Test...' : 'Run Test'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResult && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Test Result</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert
                className={cn(
                  'mb-4',
                  testResult.allowed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50',
                )}
              >
                <div className="flex items-center gap-2">
                  {testResult.allowed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertTitle className={testResult.allowed ? 'text-green-900' : 'text-red-900'}>
                    Access {testResult.allowed ? 'Allowed' : 'Denied'}
                  </AlertTitle>
                </div>
                <AlertDescription
                  className={testResult.allowed ? 'text-green-800' : 'text-red-800'}
                >
                  The request would be {testResult.allowed ? 'allowed' : 'denied'} based on the
                  evaluated policies. Final effect: <strong>{testResult.finalEffect}</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium">Matched Policies</h4>
                  {testResult.matchedPolicies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No policies matched this request
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {testResult.matchedPolicies.map((policy) => (
                        <div
                          key={policy.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="font-medium">{policy.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Priority: {policy.priority} | Effect: {policy.effect}
                            </p>
                          </div>
                          <Badge variant={policy.effect === 'allow' ? 'default' : 'destructive'}>
                            {policy.effect}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-medium">Evaluation Path</h4>
                  <div className="space-y-2">
                    {testResult.evaluationPath.map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div
                          className={cn(
                            'mt-1 h-2 w-2 rounded-full',
                            step.matched ? 'bg-green-500' : 'bg-gray-300',
                          )}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{step.policy.name}</p>
                          <p className="text-sm text-muted-foreground">{step.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={exportTestCase}>
                  <Code className="mr-2 h-4 w-4" />
                  Export Test Case
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
