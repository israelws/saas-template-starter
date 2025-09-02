'use client';

import React, { useState, DragEvent } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NODE_CATEGORIES, INodeData } from '@/lib/workflow/node-types';
import { cn } from '@/lib/utils';

interface NodePaletteProps {
  onNodeSelect?: (node: INodeData) => void;
}

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    triggers: '#22c55e',
    ai: '#3b82f6',
    logic: '#f59e0b',
    actions: '#06b6d4',
    data: '#8b5cf6',
    utilities: '#6b7280',
  };
  return colors[category] || '#6b7280';
};

export const NodePalette: React.FC<NodePaletteProps> = ({ onNodeSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(NODE_CATEGORIES.map(c => c.name))
  );

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const onDragStart = (event: DragEvent, node: INodeData) => {
    // Set drag data
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      nodeType: 'custom',
      nodeData: node,
    }));
    event.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback
    const dragImage = event.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.8';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 50, 20);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleNodeClick = (node: INodeData) => {
    if (onNodeSelect) {
      onNodeSelect(node);
    }
  };

  // Filter nodes based on search
  const filteredCategories = NODE_CATEGORIES.map(category => ({
    ...category,
    nodes: category.nodes.filter(
      node =>
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.nodes.length > 0);

  return (
    <Card className="w-80 h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3">Node Library</h3>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredCategories.map((category) => (
            <Collapsible
              key={category.name}
              open={expandedCategories.has(category.name)}
              onOpenChange={() => toggleCategory(category.name)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-2 h-auto"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getCategoryColor(category.name) }}
                    />
                    <span className="font-medium text-sm">{category.label}</span>
                    <span className="text-xs text-muted-foreground">
                      ({category.nodes.length})
                    </span>
                  </div>
                  {expandedCategories.has(category.name) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2 space-y-1">
                {category.nodes.map((node) => (
                  <TooltipProvider key={node.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          draggable
                          onDragStart={(e) => onDragStart(e, node)}
                          onClick={() => handleNodeClick(node)}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded-md cursor-move',
                            'hover:bg-accent transition-colors',
                            'border border-transparent hover:border-border'
                          )}
                        >
                          {node.icon && (
                            <span className="text-lg flex-shrink-0">
                              {node.icon}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {node.label}
                            </p>
                            {node.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {node.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-2">
                          <div className="font-semibold">{node.label}</div>
                          {node.description && (
                            <div className="text-xs">{node.description}</div>
                          )}
                          {node.inputs && node.inputs.length > 0 && (
                            <div className="text-xs">
                              <div className="font-medium mb-1">Inputs:</div>
                              {node.inputs.slice(0, 3).map((input) => (
                                <div key={input.name} className="ml-2">
                                  • {input.label}
                                </div>
                              ))}
                              {node.inputs.length > 3 && (
                                <div className="ml-2 text-muted-foreground">
                                  ... and {node.inputs.length - 3} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}

          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No nodes found</p>
              <p className="text-xs mt-1">Try adjusting your search</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t text-xs text-muted-foreground">
        <p>Drag nodes to canvas or click to add</p>
      </div>
    </Card>
  );
};