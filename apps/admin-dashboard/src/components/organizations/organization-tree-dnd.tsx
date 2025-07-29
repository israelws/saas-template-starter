'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight, ChevronDown, Building2, Users, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Organization } from '@saas-template/shared';

interface OrganizationNode extends Organization {
  children?: OrganizationNode[];
}

interface OrganizationTreeDndProps {
  organizations: OrganizationNode[];
  onMoveOrganization: (
    organizationId: string,
    newParentId: string | null,
    newIndex: number,
  ) => void;
  selectedOrganizationId?: string;
  onSelectOrganization?: (organization: OrganizationNode) => void;
}

interface SortableTreeNodeProps {
  node: OrganizationNode;
  level: number;
  selectedOrganizationId?: string;
  onSelectOrganization?: (organization: OrganizationNode) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  isOverlay?: boolean;
}

const SortableTreeNode: React.FC<SortableTreeNodeProps> = ({
  node,
  level,
  selectedOrganizationId,
  onSelectOrganization,
  expandedNodes,
  onToggleExpand,
  isOverlay = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({
      id: node.id,
      data: {
        node,
        level,
      },
    });

  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedOrganizationId === node.id;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.5 : 1,
  };

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

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          'group flex items-center gap-1 py-1.5 px-2 hover:bg-muted/50 rounded-sm cursor-pointer',
          isSelected && 'bg-muted',
          isOver && 'bg-primary/10 border-primary',
          isOverlay && 'shadow-lg bg-background border',
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={handleSelect}
      >
        <div
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-muted rounded-sm cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>

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
        </div>
      </div>

      {hasChildren && isExpanded && !isOverlay && (
        <div>
          <SortableContext
            items={node.children!.map((child) => child.id)}
            strategy={verticalListSortingStrategy}
          >
            {node.children!.map((child) => (
              <SortableTreeNode
                key={child.id}
                node={child}
                level={level + 1}
                selectedOrganizationId={selectedOrganizationId}
                onSelectOrganization={onSelectOrganization}
                expandedNodes={expandedNodes}
                onToggleExpand={onToggleExpand}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
};

export const OrganizationTreeDnd: React.FC<OrganizationTreeDndProps> = ({
  organizations,
  onMoveOrganization,
  selectedOrganizationId,
  onSelectOrganization,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(organizations.map((org) => org.id)),
  );
  const [activeNode, setActiveNode] = useState<OrganizationNode | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const onToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const node = active.data.current?.node as OrganizationNode;
    setActiveNode(node);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveNode(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeNode = active.data.current?.node as OrganizationNode;
    const overNode = over.data.current?.node as OrganizationNode;

    // Prevent moving a parent into its own child
    const isDescendant = (parent: OrganizationNode, childId: string): boolean => {
      if (parent.children) {
        for (const child of parent.children) {
          if (child.id === childId || isDescendant(child, childId)) {
            return true;
          }
        }
      }
      return false;
    };

    if (isDescendant(activeNode, overNode.id)) {
      return;
    }

    // Determine the new parent and index
    const newParentId = overNode.parentId || null;
    const newIndex = 0; // Simplified - in real app, calculate proper index

    onMoveOrganization(activeNode.id, newParentId, newIndex);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // You can add visual feedback here during drag over
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="w-full">
        <div className="border rounded-md p-2">
          {organizations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No organizations found</p>
            </div>
          ) : (
            <SortableContext
              items={organizations.map((org) => org.id)}
              strategy={verticalListSortingStrategy}
            >
              {organizations.map((org) => (
                <SortableTreeNode
                  key={org.id}
                  node={org}
                  level={0}
                  selectedOrganizationId={selectedOrganizationId}
                  onSelectOrganization={onSelectOrganization}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeNode && (
          <SortableTreeNode
            node={activeNode}
            level={0}
            expandedNodes={new Set()}
            onToggleExpand={() => {}}
            isOverlay
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};
