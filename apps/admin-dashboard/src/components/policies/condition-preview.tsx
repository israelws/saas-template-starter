'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResourceAttributeCondition {
  id: string;
  attribute: string;
  operator: string;
  value: string | string[] | number | boolean;
  type: 'string' | 'number' | 'boolean' | 'array';
}

interface ConditionPreviewProps {
  resourceType: string;
  conditions: ResourceAttributeCondition[];
  effect: 'allow' | 'deny';
  className?: string;
}

const OPERATOR_TEXTS: Record<string, string> = {
  equals: 'is',
  not_equals: 'is not',
  contains: 'contains',
  not_contains: 'does not contain',
  starts_with: 'starts with',
  ends_with: 'ends with',
  in: 'is in',
  not_in: 'is not in',
  greater_than: 'is greater than',
  greater_than_or_equals: 'is at least',
  less_than: 'is less than',
  less_than_or_equals: 'is at most',
  between: 'is between',
};

const VALUE_DESCRIPTIONS: Record<string, string> = {
  '${subject.organizationId}': "the user's organization",
  '${subject.parentOrganizationId}': "the user's parent organization",
  '${subject.childOrganizationIds}': "the user's child organizations",
  '${subject.id}': 'the current user',
  '${subject.managerId}': "the user's manager",
  '${subject.teamMemberIds}': "the user's team members",
  '${subject.departmentId}': "the user's department",
  '${subject.patientIds}': "the therapist's patients",
  '${department.patientIds}': 'patients in the department',
  '${organization.patientIds}': 'patients in the organization',
  '${department.therapistIds}': 'therapists in the department',
  '*': 'any value',
  'null': 'empty',
};

const ATTRIBUTE_DESCRIPTIONS: Record<string, string> = {
  organizationId: 'organization',
  departmentId: 'department',
  ownerId: 'owner',
  createdBy: 'creator',
  status: 'status',
  visibility: 'visibility',
  patientId: 'patient',
  therapistId: 'therapist',
  teamId: 'team',
  projectId: 'project',
};

export const ConditionPreview: React.FC<ConditionPreviewProps> = ({
  resourceType,
  conditions,
  effect,
  className,
}) => {
  if (!conditions || conditions.length === 0) {
    return null;
  }

  const generateDescription = () => {
    const parts: string[] = [];
    
    conditions.forEach((condition, index) => {
      const attributeDesc = ATTRIBUTE_DESCRIPTIONS[condition.attribute] || condition.attribute;
      const operatorText = OPERATOR_TEXTS[condition.operator] || condition.operator;
      const valueDesc = VALUE_DESCRIPTIONS[condition.value as string] || 
                       (typeof condition.value === 'string' && condition.value.startsWith('${') 
                         ? 'a dynamic value' 
                         : `"${condition.value}"`);
      
      const conditionText = `${attributeDesc} ${operatorText} ${valueDesc}`;
      
      if (index === 0) {
        parts.push(conditionText);
      } else {
        parts.push(`and ${conditionText}`);
      }
    });

    const conditionsText = parts.join(' ');
    const actionText = effect === 'allow' ? 'can access' : 'cannot access';
    
    return `Users ${actionText} ${resourceType.toLowerCase()}s where ${conditionsText}.`;
  };

  const hasWildcard = conditions.some(c => c.value === '*');
  const isRestrictive = conditions.length > 0 && !hasWildcard;

  return (
    <Alert className={cn(
      "mt-4",
      isRestrictive ? "border-blue-200 bg-blue-50" : "border-yellow-200 bg-yellow-50",
      className
    )}>
      <div className="flex items-start gap-2">
        {isRestrictive ? (
          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
        )}
        <AlertDescription className="text-sm">
          <strong>Preview:</strong> {generateDescription()}
          {hasWildcard && (
            <span className="block mt-1 text-xs text-muted-foreground">
              Note: Using wildcard (*) allows access to all {resourceType.toLowerCase()}s with this attribute.
            </span>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
};