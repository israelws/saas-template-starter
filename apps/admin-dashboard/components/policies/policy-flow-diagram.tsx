'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowDown, CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Policy, PolicyEffect } from '@saas-template/shared';

interface PolicyFlowDiagramProps {
  policies: Policy[];
  highlightedPolicyId?: string;
  onPolicyClick?: (policy: Policy) => void;
}

export const PolicyFlowDiagram: React.FC<PolicyFlowDiagramProps> = ({
  policies,
  highlightedPolicyId,
  onPolicyClick,
}) => {
  // Group policies by priority levels
  const policyLevels = React.useMemo(() => {
    const levels: Map<number, Policy[]> = new Map();

    policies.forEach((policy) => {
      const priority = policy.priority;
      if (!levels.has(priority)) {
        levels.set(priority, []);
      }
      levels.get(priority)!.push(policy);
    });

    // Sort by priority (descending)
    return Array.from(levels.entries())
      .sort(([a], [b]) => b - a)
      .map(([priority, policies]) => ({
        priority,
        policies: policies.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [policies]);

  const getEffectBgColor = (effect: 'allow' | 'deny') => {
    return effect === 'allow' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  const getEffectIcon = (effect: 'allow' | 'deny') => {
    return effect === 'allow' ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Policy Evaluation Flow</CardTitle>
        <CardDescription>
          Visual representation of how policies are evaluated in order of priority
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full pr-4">
          <div className="space-y-8">
            {/* Request Input */}
            <div className="flex flex-col items-center">
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 text-center">
                <Shield className="mx-auto mb-2 h-8 w-8 text-primary" />
                <h3 className="font-semibold">Access Request</h3>
                <p className="text-sm text-muted-foreground">Subject → Resource → Action</p>
              </div>
              <ArrowDown className="my-4 h-6 w-6 text-muted-foreground" />
            </div>

            {/* Policy Levels */}
            {policyLevels.map((level, levelIndex) => (
              <div key={level.priority} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <Badge variant="secondary" className="font-mono">
                    Priority {level.priority}
                  </Badge>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {level.policies.map((policy) => (
                    <div
                      key={policy.id}
                      className={cn(
                        'cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md',
                        highlightedPolicyId === policy.id && 'ring-2 ring-primary',
                        getEffectBgColor(policy.effect),
                      )}
                      onClick={() => onPolicyClick?.(policy)}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getEffectIcon(policy.effect)}
                          <h4 className="font-medium">{policy.name}</h4>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Resource:</span>
                          <code className="rounded bg-muted px-1">
                            {policy.resources?.types?.join(', ') || 'N/A'}
                          </code>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Action:</span>
                          <code className="rounded bg-muted px-1">
                            {policy.actions?.join(', ') || 'N/A'}
                          </code>
                        </div>
                        {policy.conditions && Object.keys(policy.conditions).length > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {Object.keys(policy.conditions).length} condition(s)
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <Badge
                          variant={policy.effect === PolicyEffect.ALLOW ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {policy.effect.toUpperCase()}
                        </Badge>
                        {policy.isActive ? (
                          <Badge variant="outline" className="text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {levelIndex < policyLevels.length - 1 && (
                  <div className="flex justify-center">
                    <ArrowDown className="my-4 h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Final Decision */}
            <div className="flex flex-col items-center">
              <ArrowDown className="my-4 h-6 w-6 text-muted-foreground" />
              <div className="grid w-full max-w-md grid-cols-2 gap-4">
                <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 text-center">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600" />
                  <h3 className="font-semibold text-green-900">Access Granted</h3>
                  <p className="text-sm text-green-700">If any allow policy matches</p>
                </div>
                <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 text-center">
                  <XCircle className="mx-auto mb-2 h-8 w-8 text-red-600" />
                  <h3 className="font-semibold text-red-900">Access Denied</h3>
                  <p className="text-sm text-red-700">If deny policy matches or no allow</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="mt-6 rounded-lg bg-muted p-4">
          <h4 className="mb-2 text-sm font-medium">Evaluation Rules:</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              Policies are evaluated in order of priority (highest first)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              Within the same priority, deny policies take precedence
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              First matching policy determines the outcome
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              If no policies match, access is denied by default
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
