import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Copy, Trash2, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface CustomNodeData {
  label: string;
  type: string;
  category: string;
  icon?: string;
  description?: string;
  color?: string;
  inputs?: any[];
  outputs?: any[];
  inputAnchors?: Array<{
    id: string;
    label: string;
    name: string;
    type: string;
    optional?: boolean;
  }>;
  outputAnchors?: Array<{
    id: string;
    label: string;
    name: string;
    type: string;
  }>;
  selected?: boolean;
  configured?: boolean;
  error?: string;
  nodeId?: string;
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

const isStartNode = (data: CustomNodeData): boolean => {
  return data.nodeId === 'manual-trigger' || 
         data.type === 'trigger' || 
         data.label?.toLowerCase().includes('start') ||
         data.label?.toLowerCase().includes('trigger');
};

const CustomNode = memo(({ data, selected, id }: NodeProps<CustomNodeData>) => {
  const [isHovered, setIsHovered] = useState(false);
  const color = data.color || getCategoryColor(data.category);
  const isStart = isStartNode(data);

  const handleNodeAction = (action: string, event: React.MouseEvent) => {
    event.stopPropagation();
    // Emit custom event for parent to handle
    const customEvent = new CustomEvent('nodeAction', {
      detail: { action, nodeId: id },
    });
    window.dispatchEvent(customEvent);
  };

  return (
    <TooltipProvider>
      <Card
        className={cn(
          'min-w-[200px] max-w-[300px] transition-all relative',
          selected && 'ring-2 ring-primary ring-offset-2',
          isHovered && 'shadow-lg',
          data.error && 'border-red-500',
          isStart && 'shadow-xl ring-2 ring-green-500/30 ring-offset-2'
        )}
        style={{
          borderColor: selected ? undefined : isStart ? '#22c55e' : color,
          borderWidth: isStart ? '4px' : '2px',
          borderStyle: isStart ? 'double' : 'solid',
          background: isStart 
            ? `linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)` 
            : 'white',
          boxShadow: isStart 
            ? '0 10px 25px -5px rgba(34, 197, 94, 0.25), 0 8px 10px -6px rgba(34, 197, 94, 0.1)'
            : undefined,
          transform: isStart && !selected ? 'scale(1.05)' : 'scale(1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Input Handles */}
        {data.inputAnchors?.map((input, index) => (
          <Handle
            key={input.id}
            type="target"
            position={Position.Left}
            id={input.id}
            style={{
              top: `${((index + 1) * 100) / (data.inputAnchors!.length + 1)}%`,
              background: input.optional ? '#94a3b8' : '#1e293b',
              width: '12px',
              height: '12px',
              border: '2px solid white',
              left: '-7px',
            }}
            className="!cursor-crosshair"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute -left-2 -top-2 w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-xs">
                  <span className="font-semibold">{input.label}</span>
                  {input.optional && ' (Optional)'}
                  <br />
                  Type: {input.type}
                </p>
              </TooltipContent>
            </Tooltip>
          </Handle>
        ))}

        {/* Node Content */}
        <div className="p-3">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              {data.icon && (
                <div className="flex items-center justify-center">
                  <span className={cn(
                    "text-lg",
                    isStart && "text-2xl filter drop-shadow-md"
                  )}>
                    {isStart ? '🚀' : data.icon}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h3 className={cn(
                  "font-semibold text-sm",
                  isStart && "font-bold text-base text-green-700"
                )}>
                  {data.label}
                </h3>
                {data.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {data.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Action Buttons (always visible) */}
            <div className="flex items-center gap-1 ml-2 nodrag nopan opacity-60 hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => handleNodeAction('configure', e)}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Configure</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => handleNodeAction('duplicate', e)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Duplicate</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => handleNodeAction('delete', e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-2 mt-2">
            {data.configured && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-muted-foreground">Configured</span>
              </div>
            )}
            {data.error && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-xs text-red-500">{data.error}</span>
              </div>
            )}
          </div>

          {/* Additional Info */}
          {data.category && !isStart && (
            <div className="mt-2 pt-2 border-t">
              <span 
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: `${color}20`,
                  color: color,
                }}
              >
                {data.category}
              </span>
            </div>
          )}
        </div>

        {/* Output Handles */}
        {data.outputAnchors?.map((output, index) => (
          <Handle
            key={output.id}
            type="source"
            position={Position.Right}
            id={output.id}
            style={{
              top: `${((index + 1) * 100) / (data.outputAnchors!.length + 1)}%`,
              background: '#1e293b',
              width: '12px',
              height: '12px',
              border: '2px solid white',
              right: '-7px',
            }}
            className="!cursor-crosshair"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute -right-2 -top-2 w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">
                  <span className="font-semibold">{output.label}</span>
                  <br />
                  Type: {output.type}
                </p>
              </TooltipContent>
            </Tooltip>
          </Handle>
        ))}
      </Card>
    </TooltipProvider>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;