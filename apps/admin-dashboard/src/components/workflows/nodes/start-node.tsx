'use client';

import { Handle, Position } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Play } from 'lucide-react';

export function StartNode({ data }: any) {
  return (
    <Card className="p-3 min-w-[150px]">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-green-500">
          <Play className="h-4 w-4 text-white" />
        </div>
        <span className="font-medium">Start</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2"
      />
    </Card>
  );
}