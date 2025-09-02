'use client';

import { Handle, Position } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Database } from 'lucide-react';

export function EntityReaderNode({ data }: any) {
  return (
    <Card className="p-3 min-w-[180px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2"
      />
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded bg-indigo-500">
          <Database className="h-4 w-4 text-white" />
        </div>
        <span className="font-medium">Read Entity</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {data.config?.entityType || 'Select entity'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2"
      />
    </Card>
  );
}