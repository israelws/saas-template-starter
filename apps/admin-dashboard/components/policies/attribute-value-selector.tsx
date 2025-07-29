'use client';

import React, { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  User, 
  Users, 
  Building, 
  UserCheck, 
  Globe, 
  Briefcase,
  Heart,
  Stethoscope,
  FileText,
  Shield,
  ChevronDown,
  Code,
  Info
} from 'lucide-react';

export interface SemanticOption {
  label: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
  category?: string;
}

interface AttributeValueSelectorProps {
  attribute: string;
  resourceType: string;
  value: string;
  onChange: (value: string) => void;
  operator?: string;
  className?: string;
}

// Semantic options for different attribute types
const SEMANTIC_OPTIONS: Record<string, SemanticOption[]> = {
  organizationId: [
    {
      label: "User's Organization",
      value: '${subject.organizationId}',
      description: 'The organization the user belongs to',
      icon: <Building className="h-4 w-4" />,
      category: 'Dynamic Values'
    },
    {
      label: 'Any Organization',
      value: '*',
      description: 'Matches any organization',
      icon: <Globe className="h-4 w-4" />,
      category: 'Special Values'
    },
    {
      label: 'Parent Organization',
      value: '${subject.parentOrganizationId}',
      description: 'The parent organization of the user\'s organization',
      icon: <Building className="h-4 w-4" />,
      category: 'Dynamic Values'
    },
    {
      label: 'Child Organizations',
      value: '${subject.childOrganizationIds}',
      description: 'All child organizations under the user\'s organization',
      icon: <Building className="h-4 w-4" />,
      category: 'Dynamic Values'
    },
  ],
  ownerId: [
    {
      label: 'Current User',
      value: '${subject.id}',
      description: 'The authenticated user',
      icon: <User className="h-4 w-4" />,
      category: 'User References'
    },
    {
      label: "User's Manager",
      value: '${subject.managerId}',
      description: 'The manager of the current user',
      icon: <UserCheck className="h-4 w-4" />,
      category: 'User References'
    },
    {
      label: 'Team Members',
      value: '${subject.teamMemberIds}',
      description: 'All members of the user\'s team',
      icon: <Users className="h-4 w-4" />,
      category: 'User References'
    },
  ],
  createdBy: [
    {
      label: 'Current User',
      value: '${subject.id}',
      description: 'The authenticated user',
      icon: <User className="h-4 w-4" />,
      category: 'User References'
    },
    {
      label: 'Any User',
      value: '*',
      description: 'Matches any user',
      icon: <Globe className="h-4 w-4" />,
      category: 'Special Values'
    },
  ],
  departmentId: [
    {
      label: "User's Department",
      value: '${subject.departmentId}',
      description: 'The department the user belongs to',
      icon: <Briefcase className="h-4 w-4" />,
      category: 'Dynamic Values'
    },
    {
      label: 'Any Department',
      value: '*',
      description: 'Matches any department',
      icon: <Globe className="h-4 w-4" />,
      category: 'Special Values'
    },
  ],
  status: [
    {
      label: 'Active',
      value: 'active',
      description: 'Active status',
      category: 'Status Values'
    },
    {
      label: 'Inactive',
      value: 'inactive',
      description: 'Inactive status',
      category: 'Status Values'
    },
    {
      label: 'Pending',
      value: 'pending',
      description: 'Pending status',
      category: 'Status Values'
    },
    {
      label: 'Archived',
      value: 'archived',
      description: 'Archived status',
      category: 'Status Values'
    },
  ],
  visibility: [
    {
      label: 'Public',
      value: 'public',
      description: 'Visible to everyone',
      icon: <Globe className="h-4 w-4" />,
      category: 'Visibility Levels'
    },
    {
      label: 'Private',
      value: 'private',
      description: 'Visible only to owner',
      icon: <Shield className="h-4 w-4" />,
      category: 'Visibility Levels'
    },
    {
      label: 'Organization',
      value: 'organization',
      description: 'Visible to organization members',
      icon: <Building className="h-4 w-4" />,
      category: 'Visibility Levels'
    },
    {
      label: 'Department',
      value: 'department',
      description: 'Visible to department members',
      icon: <Briefcase className="h-4 w-4" />,
      category: 'Visibility Levels'
    },
  ],
  // Healthcare specific
  patientId: [
    {
      label: "Therapist's Patients",
      value: '${subject.patientIds}',
      description: 'All patients assigned to the therapist',
      icon: <Heart className="h-4 w-4" />,
      category: 'Healthcare'
    },
    {
      label: 'Department Patients',
      value: '${department.patientIds}',
      description: 'All patients in the department',
      icon: <Briefcase className="h-4 w-4" />,
      category: 'Healthcare'
    },
    {
      label: 'Organization Patients',
      value: '${organization.patientIds}',
      description: 'All patients in the organization',
      icon: <Building className="h-4 w-4" />,
      category: 'Healthcare'
    },
  ],
  therapistId: [
    {
      label: 'Current Therapist',
      value: '${subject.id}',
      description: 'The authenticated therapist',
      icon: <Stethoscope className="h-4 w-4" />,
      category: 'Healthcare'
    },
    {
      label: 'Department Therapists',
      value: '${department.therapistIds}',
      description: 'All therapists in the department',
      icon: <Briefcase className="h-4 w-4" />,
      category: 'Healthcare'
    },
  ],
};

// Add generic options for any attribute
const GENERIC_OPTIONS: SemanticOption[] = [
  {
    label: 'Any Value',
    value: '*',
    description: 'Matches any value',
    icon: <Globe className="h-4 w-4" />,
    category: 'Special Values'
  },
  {
    label: 'Empty/Null',
    value: 'null',
    description: 'Matches empty or null values',
    category: 'Special Values'
  },
];

export const AttributeValueSelector: React.FC<AttributeValueSelectorProps> = ({
  attribute,
  resourceType,
  value,
  onChange,
  operator,
  className,
}) => {
  const [mode, setMode] = useState<'semantic' | 'custom'>(
    value && !value.startsWith('${') && value !== '*' ? 'custom' : 'semantic'
  );

  const semanticOptions = useMemo(() => {
    const specific = SEMANTIC_OPTIONS[attribute] || [];
    return [...specific, ...GENERIC_OPTIONS];
  }, [attribute]);

  const currentOption = useMemo(() => {
    return semanticOptions.find(opt => opt.value === value);
  }, [semanticOptions, value]);

  // Group options by category
  const groupedOptions = useMemo(() => {
    const groups: Record<string, SemanticOption[]> = {};
    semanticOptions.forEach(option => {
      const category = option.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(option);
    });
    return groups;
  }, [semanticOptions]);

  const getValuePreview = () => {
    if (currentOption) {
      return (
        <div className="flex items-center gap-2">
          {currentOption.icon}
          <span>{currentOption.label}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{currentOption.description}</p>
                <p className="text-xs text-muted-foreground mt-1">Value: {currentOption.value}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    }
    
    if (value.startsWith('${')) {
      return (
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          <span className="font-mono text-sm">{value}</span>
        </div>
      );
    }
    
    return value || 'Select a value...';
  };

  return (
    <div className={className}>
      {mode === 'semantic' ? (
        <div className="space-y-2">
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {getValuePreview()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(groupedOptions).map(([category, options]) => (
                <SelectGroup key={category}>
                  <SelectLabel>{category}</SelectLabel>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-muted-foreground">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
              <SelectGroup>
                <SelectLabel>Custom</SelectLabel>
                <SelectItem value="__custom__">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    <span>Enter custom value...</span>
                  </div>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          {value === '__custom__' && (
            <div className="flex gap-2">
              <Input
                placeholder="Enter custom value or ${variable}"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onChange(e.currentTarget.value);
                    setMode('custom');
                  }
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMode('custom')}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter value or ${variable}"
            className="font-mono text-sm"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMode('semantic')}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Switch to semantic selector</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};