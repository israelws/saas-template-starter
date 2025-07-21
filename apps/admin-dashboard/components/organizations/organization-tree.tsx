'use client';

import React, { useState, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Building2,
  Users,
  Settings,
  Plus,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Organization } from '@saas-template/shared';

interface OrganizationNode extends Organization {
  children?: OrganizationNode[];
}

interface OrganizationTreeProps {
  organizations: OrganizationNode[];
  selectedOrganizationId?: string;
  onSelectOrganization?: (organization: OrganizationNode) => void;
  onAddOrganization?: (parentId: string | null) => void;
  onEditOrganization?: (organization: OrganizationNode) => void;
  onDeleteOrganization?: (organization: OrganizationNode) => void;
  onViewDetails?: (organization: OrganizationNode) => void;
  expandedNodes?: Set<string>;
  onToggleExpand?: (nodeId: string) => void;
}

interface TreeNodeProps {
  node: OrganizationNode;
  level: number;
  selectedOrganizationId?: string;
  onSelectOrganization?: (organization: OrganizationNode) => void;
  onAddOrganization?: (parentId: string | null) => void;
  onEditOrganization?: (organization: OrganizationNode) => void;
  onDeleteOrganization?: (organization: OrganizationNode) => void;
  onViewDetails?: (organization: OrganizationNode) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  selectedOrganizationId,
  onSelectOrganization,
  onAddOrganization,
  onEditOrganization,
  onDeleteOrganization,
  onViewDetails,
  expandedNodes,
  onToggleExpand,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedOrganizationId === node.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleExpand(node.id);
    }
  };

  const handleSelect = () => {
    onSelectOrganization?.(node);
  };

  const getIcon = () => {
    switch (node.type) {
      case 'company':
        return <Building2 className="h-4 w-4" />;
      case 'division':
        return <Building2 className="h-4 w-4 opacity-80" />;
      case 'department':
        return <Users className="h-4 w-4" />;
      case 'team':
        return <Users className="h-4 w-4 opacity-80" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    if (node.isActive) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-1 py-1.5 px-2 hover:bg-muted/50 rounded-sm cursor-pointer',
          isSelected && 'bg-muted',
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={handleSelect}
      >
        <button
          onClick={handleToggle}
          className={cn(
            'p-0.5 hover:bg-muted rounded-sm transition-colors',
            !hasChildren && 'invisible',
          )}
        >
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            ))}
        </button>

        <div className="flex items-center gap-2 flex-1">
          {getIcon()}
          <span className="text-sm font-medium">{node.name}</span>
          <span className="text-xs text-muted-foreground">({node.code})</span>
          <Badge variant="outline" className={cn('text-xs', getStatusColor())}>
            {node.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails?.(node)}>
                <Settings className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditOrganization?.(node)}>
                <Settings className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddOrganization?.(node.id)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Child
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDeleteOrganization?.(node)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedOrganizationId={selectedOrganizationId}
              onSelectOrganization={onSelectOrganization}
              onAddOrganization={onAddOrganization}
              onEditOrganization={onEditOrganization}
              onDeleteOrganization={onDeleteOrganization}
              onViewDetails={onViewDetails}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </>
  );
};

export const OrganizationTree: React.FC<OrganizationTreeProps> = ({
  organizations,
  selectedOrganizationId,
  onSelectOrganization,
  onAddOrganization,
  onEditOrganization,
  onDeleteOrganization,
  onViewDetails,
  expandedNodes: controlledExpandedNodes,
  onToggleExpand: controlledOnToggleExpand,
}) => {
  const [internalExpandedNodes, setInternalExpandedNodes] = useState<Set<string>>(
    new Set(organizations.map((org) => org.id)),
  );

  const expandedNodes = controlledExpandedNodes ?? internalExpandedNodes;
  const onToggleExpand =
    controlledOnToggleExpand ??
    ((nodeId: string) => {
      setInternalExpandedNodes((prev) => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });
    });

  const expandAll = useCallback(() => {
    const allNodeIds = new Set<string>();
    const collectIds = (nodes: OrganizationNode[]) => {
      nodes.forEach((node) => {
        allNodeIds.add(node.id);
        if (node.children) {
          collectIds(node.children);
        }
      });
    };
    collectIds(organizations);
    setInternalExpandedNodes(allNodeIds);
  }, [organizations]);

  const collapseAll = useCallback(() => {
    setInternalExpandedNodes(new Set());
  }, []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-sm font-semibold">Organization Hierarchy</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddOrganization?.(null)}
            className="h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Root
          </Button>
          <Button variant="ghost" size="sm" onClick={expandAll} className="h-7 px-2 text-xs">
            Expand All
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll} className="h-7 px-2 text-xs">
            Collapse All
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        {organizations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No organizations found</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddOrganization?.(null)}
              className="mt-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              Create First Organization
            </Button>
          </div>
        ) : (
          <div className="p-2">
            {organizations.map((org) => (
              <TreeNode
                key={org.id}
                node={org}
                level={0}
                selectedOrganizationId={selectedOrganizationId}
                onSelectOrganization={onSelectOrganization}
                onAddOrganization={onAddOrganization}
                onEditOrganization={onEditOrganization}
                onDeleteOrganization={onDeleteOrganization}
                onViewDetails={onViewDetails}
                expandedNodes={expandedNodes}
                onToggleExpand={onToggleExpand}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
