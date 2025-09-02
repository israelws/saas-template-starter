'use client';

import { Handle, Position } from 'reactflow';
import { Card } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';

export function ConditionNode({ data }: any) {
  return (
    <Card className="p-3 min-w-[180px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2"
      />
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded bg-yellow-500">
          <GitBranch className="h-4 w-4 text-white" />
        </div>
        <span className="font-medium">Condition</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {data.label || 'If/Else'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="w-2 h-2"
        style={{ top: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="w-2 h-2"
        style={{ top: '70%' }}
      />
    </Card>
  );
}