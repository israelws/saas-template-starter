'use client';

import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection,
  ReactFlowProvider,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
} from 'reactflow';
import '@/styles/reactflow.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { workflowService } from '@/services/workflow.service';
import { Save, Plus, Play, X } from 'lucide-react';
import { NodePalette } from './node-palette';
import { StartNode } from './nodes/start-node';
import { LLMNode } from './nodes/llm-node';
import { TransformNode } from './nodes/transform-node';
import { ConditionNode } from './nodes/condition-node';
import { EntityReaderNode } from './nodes/entity-reader-node';
import { EntityWriterNode } from './nodes/entity-writer-node';

const nodeTypes = {
  start: StartNode,
  llm: LLMNode,
  transform: TransformNode,
  condition: ConditionNode,
  entityReader: EntityReaderNode,
  entityWriter: EntityWriterNode,
};

interface WorkflowCanvasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  onSave: () => void;
}

export function WorkflowCanvas({
  open,
  onOpenChange,
  workflowId,
  onSave,
}: WorkflowCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && workflowId) {
      loadWorkflow();
    }
  }, [open, workflowId]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getById(workflowId);
      setWorkflow(data);
      setNodes(data.flowDefinition.nodes || []);
      setEdges(data.flowDefinition.edges || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load workflow',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await workflowService.update(workflowId, {
        ...workflow,
        flowDefinition: {
          nodes,
          edges,
        },
      });
      onSave();
      toast({
        title: 'Success',
        description: 'Workflow saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save workflow',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExecute = async () => {
    try {
      const execution = await workflowService.execute(workflowId, {});
      toast({
        title: 'Workflow Started',
        description: `Execution ID: ${execution.id}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute workflow',
        variant: 'destructive',
      });
    }
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type) return;

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode: Node = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: { 
          label: type.charAt(0).toUpperCase() + type.slice(1),
          config: {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-[90vh] p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>{workflow?.name || 'Workflow Canvas'}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExecute}
              >
                <Play className="h-4 w-4 mr-1" />
                Execute
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-1 h-full">
          <NodePalette />
          <div className="flex-1">
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                fitView
              >
                <Controls />
                <MiniMap />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}