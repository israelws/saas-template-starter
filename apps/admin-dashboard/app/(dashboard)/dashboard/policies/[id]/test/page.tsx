'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { policyAPI } from '@/lib/api'
import { PolicyEvaluationContext, PolicyEvaluationResult } from '@saas-template/shared'
import { ArrowLeft, Play, CheckCircle, XCircle } from 'lucide-react'

export default function PolicyTestPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PolicyEvaluationResult | null>(null)
  const [context, setContext] = useState<string>(`{
  "subject": {
    "id": "user-123",
    "roles": ["admin"],
    "groups": [],
    "attributes": {
      "department": "IT"
    }
  },
  "resource": {
    "type": "organization",
    "id": "org-456",
    "attributes": {
      "owner": "user-123"
    }
  },
  "action": "read",
  "environment": {
    "timestamp": "${new Date().toISOString()}",
    "ipAddress": "192.168.1.1",
    "attributes": {}
  },
  "organizationId": "org-456"
}`)

  const handleTest = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // Parse and validate JSON
      const parsedContext = JSON.parse(context) as PolicyEvaluationContext
      
      // Test the policy
      const response = await policyAPI.test({
        ...parsedContext,
        policyId: params.id as string,
      })
      
      setResult(response.data)
      
      toast({
        title: 'Test completed',
        description: `Policy ${response.data.allowed ? 'allowed' : 'denied'} the action`,
      })
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        toast({
          title: 'Invalid JSON',
          description: 'Please check your test context JSON syntax',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to test policy',
          variant: 'destructive',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(context)
      setContext(JSON.stringify(parsed, null, 2))
    } catch {
      toast({
        title: 'Invalid JSON',
        description: 'Cannot format invalid JSON',
        variant: 'destructive',
      })
    }
  }

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/policies/${params.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Policy
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Test Policy</h1>
        <p className="text-gray-500">Test how this policy evaluates in different scenarios</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Test Context</CardTitle>
            <CardDescription>
              Define the evaluation context for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="context">Evaluation Context (JSON)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={formatJSON}
                >
                  Format JSON
                </Button>
              </div>
              <Textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Enter evaluation context as JSON"
                rows={20}
                className="font-mono text-sm"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleTest}
              disabled={isLoading}
              className="w-full"
            >
              <Play className="mr-2 h-4 w-4" />
              {isLoading ? 'Testing...' : 'Run Test'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Policy evaluation results and details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {result.allowed ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600" />
                  )}
                  <span className="text-2xl font-bold">
                    {result.allowed ? 'Allowed' : 'Denied'}
                  </span>
                </div>

                {result.reason && (
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <p className="text-sm text-gray-600">{result.reason}</p>
                  </div>
                )}

                {result.evaluationTime && (
                  <div className="space-y-2">
                    <Label>Evaluation Time</Label>
                    <p className="text-sm text-gray-600">{result.evaluationTime}ms</p>
                  </div>
                )}

                {result.policiesEvaluated && (
                  <div className="space-y-2">
                    <Label>Policies Evaluated</Label>
                    <ul className="space-y-1">
                      {result.policiesEvaluated.map((policy, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          • {policy}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Full Result</Label>
                  <pre className="overflow-auto rounded bg-gray-100 p-2 text-xs">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-gray-500">
                Run a test to see results
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}