'use client';

import { Handle, Position } from 'reactflow';
import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export function LLMNode({ data }: any) {
  return (
    <Card className="p-3 min-w-[180px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2"
      />
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded bg-blue-500">
          <MessageSquare className="h-4 w-4 text-white" />
        </div>
        <span className="font-medium">LLM</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {data.config?.model || 'GPT-3.5'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2"
      />
    </Card>
  );
}