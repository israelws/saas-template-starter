'use client';

import { useState, useEffect, useCallback, useRef, DragEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  ReactFlowProvider,
  ReactFlowInstance,
  ConnectionMode,
  Panel,
  useReactFlow,
  MarkerType,
} from 'reactflow';
import './workflow-editor.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { workflowService } from '@/services/workflow.service';
import CustomNode from '@/components/workflows/custom-node';
import { NodePalette } from '@/components/workflows/node-palette';
import { NodePropertiesPanel } from '@/components/workflows/node-properties-panel';
import { INodeData, getNodeById, isValidConnection } from '@/lib/workflow/node-types';
import {
  Save,
  Play,
  Plus,
  Settings,
  ChevronLeft,
  Trash2,
  Copy,
  Download,
  Upload,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

// Node types configuration
const nodeTypes = {
  custom: CustomNode,
};

const defaultEdgeOptions = {
  animated: false,
  type: 'smoothstep',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#3b82f6',
  },
  style: {
    strokeWidth: 2.5,
    stroke: '#3b82f6',
  },
};

function WorkflowEditor() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showPalette, setShowPalette] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<INodeData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const workflowId = params.id as string;
  const isNew = workflowId === 'new';

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    const nodeData = getNodeById(node.data.nodeId || node.data.type);
    setSelectedNodeData(nodeData || null);
  }, []);

  // Handle click on empty canvas to deselect
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedNodeData(null);
  }, []);

  // Handle node deletion
  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
    setSelectedNode(null);
    setSelectedNodeData(null);
  }, []);

  useEffect(() => {
    if (!isNew) {
      loadWorkflow();
    } else {
      // Create a new workflow with a start node
      const startNode = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position: { x: 250, y: 200 },
        draggable: true,
        selectable: true,
        data: {
          label: 'Workflow Start',
          type: 'trigger',
          category: 'triggers',
          nodeId: 'manual-trigger',
          icon: '🚀',
          description: 'Click here to begin',
          outputAnchors: [
            {
              id: 'output',
              label: 'Output',
              name: 'output',
              type: 'any',
            },
          ],
        },
      };
      setNodes([startNode]);
      setEdges([]);
      setWorkflow({
        name: 'New Workflow',
        description: '',
        status: 'draft',
      });
      setLoading(false);
    }
  }, [workflowId]);

  // Listen for node actions
  useEffect(() => {
    const handleNodeAction = (event: CustomEvent) => {
      const { action, nodeId } = event.detail;
      
      switch (action) {
        case 'configure':
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            setSelectedNode(node);
            const nodeData = getNodeById(node.data.nodeId || node.data.type);
            setSelectedNodeData(nodeData || null);
          }
          break;
        case 'duplicate':
          const nodeToDuplicate = nodes.find(n => n.id === nodeId);
          if (nodeToDuplicate) {
            const newNode = {
              ...nodeToDuplicate,
              id: `node-${Date.now()}`,
              draggable: true,
              selectable: true,
              position: {
                x: nodeToDuplicate.position.x + 50,
                y: nodeToDuplicate.position.y + 50,
              },
            };
            setNodes((nds) => [...nds, newNode]);
          }
          break;
        case 'delete':
          setNodes((nds) => nds.filter(n => n.id !== nodeId));
          setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
          if (selectedNode?.id === nodeId) {
            setSelectedNode(null);
            setSelectedNodeData(null);
          }
          break;
      }
    };

    window.addEventListener('nodeAction', handleNodeAction as any);
    return () => window.removeEventListener('nodeAction', handleNodeAction as any);
  }, [nodes, selectedNode]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getById(workflowId);
      setWorkflow(data);
      
      // Load nodes and edges from workflow definition
      if (data.flowDefinition) {
        // Ensure all nodes have draggable flag
        const loadedNodes = (data.flowDefinition.nodes || []).map((node: any) => ({
          ...node,
          draggable: true,
          selectable: true,
        }));
        setNodes(loadedNodes);
        setEdges(data.flowDefinition.edges || []);
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workflow',
        variant: 'destructive',
      });
      router.push('/dashboard/workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const workflowData = {
        ...workflow,
        flowDefinition: {
          nodes,
          edges,
        },
      };

      if (isNew) {
        const created = await workflowService.create(workflowData);
        toast({
          title: 'Success',
          description: 'Workflow created successfully',
        });
        router.push(`/dashboard/workflows/${created.id}`);
      } else {
        await workflowService.update(workflowId, workflowData);
        toast({
          title: 'Success',
          description: 'Workflow saved successfully',
        });
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to save workflow',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await workflowService.delete(workflowId);
      toast({
        title: 'Success',
        description: 'Workflow deleted successfully',
      });
      router.push('/dashboard/workflows');
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete workflow',
        variant: 'destructive',
      });
    }
  };

  // Handle connections with validation
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      // Get source and target nodes
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      if (!sourceNode || !targetNode) return;
      
      // Get node data definitions
      const sourceNodeData = getNodeById(sourceNode.data.nodeId);
      const targetNodeData = getNodeById(targetNode.data.nodeId);
      
      if (!sourceNodeData || !targetNodeData) {
        // If no node data, allow connection
        setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds));
        return;
      }
      
      // Validate connection
      if (isValidConnection(
        sourceNodeData,
        targetNodeData,
        params.sourceHandle || '',
        params.targetHandle || ''
      )) {
        const edge = {
          ...params,
          ...defaultEdgeOptions,
          id: `edge-${params.source}-${params.sourceHandle || 'out'}-${params.target}-${params.targetHandle || 'in'}`,
        };
        setEdges((eds) => addEdge(edge, eds));
      } else {
        toast({
          title: 'Invalid Connection',
          description: 'These nodes cannot be connected',
          variant: 'destructive',
        });
      }
    },
    [nodes, setEdges, toast]
  );

  // Handle drag over
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop
  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const data = event.dataTransfer.getData('application/reactflow');
      
      if (!data) return;
      
      try {
        const { nodeType, nodeData } = JSON.parse(data);
        
        // Calculate position
        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        // Create new node - use 'custom' type for all nodes
        const newNode: Node = {
          id: `node-${Date.now()}-${Math.random()}`,
          type: 'custom', // Always use custom type
          position,
          draggable: true,
          selectable: true,
          data: {
            ...nodeData,
            nodeId: nodeData.id,
          },
        };

        setNodes((nds) => nds.concat(newNode));
        
        toast({
          title: 'Node Added',
          description: `${nodeData.label} has been added to the workflow`,
        });
      } catch (error) {
        console.error('Error parsing drop data:', error);
      }
    },
    [reactFlowInstance, setNodes, toast]
  );

  // Handle node selection from palette
  const handleNodeSelectFromPalette = useCallback((nodeData: INodeData) => {
    if (!reactFlowInstance) return;
    
    // Get center of viewport
    const { x, y, zoom } = reactFlowInstance.getViewport();
    const centerX = (-x + (reactFlowWrapper.current?.offsetWidth || 800) / 2) / zoom;
    const centerY = (-y + (reactFlowWrapper.current?.offsetHeight || 600) / 2) / zoom;
    
    // Create new node at center
    const newNode: Node = {
      id: `node-${Date.now()}-${Math.random()}`,
      type: 'custom',
      position: { x: centerX - 100, y: centerY - 50 },
      draggable: true,
      selectable: true,
      data: {
        ...nodeData,
        nodeId: nodeData.id,
      },
    };

    setNodes((nds) => nds.concat(newNode));
    
    // Select the new node
    setTimeout(() => {
      setSelectedNode(newNode);
      setSelectedNodeData(nodeData);
    }, 50);
  }, [reactFlowInstance, setNodes]);

  // Handle node update from properties panel
  const handleNodeUpdate = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...data,
            },
          };
        }
        return node;
      })
    );
    
    toast({
      title: 'Node Updated',
      description: 'Node configuration has been saved',
    });
  }, [setNodes, toast]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkflow({ ...workflow, name: e.target.value });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-4 lg:-m-6">
      {/* Header */}
      <div className="border-b bg-background z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/workflows')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              <Input
                value={workflow?.name || ''}
                onChange={handleNameChange}
                className="text-lg font-semibold border-0 px-2"
                placeholder="Workflow name"
              />
              <Badge variant={workflow?.status === 'active' ? 'default' : 'secondary'}>
                {workflow?.status || 'draft'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Options */}
            <div className="flex items-center gap-1 mr-2">
              <Button
                variant={showPalette ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShowPalette(!showPalette)}
                title="Toggle Node Palette"
              >
                {showPalette ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                <span className="ml-1">Palette</span>
              </Button>
              <Button
                variant={showGrid ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShowGrid(!showGrid)}
              >
                Grid
              </Button>
              <Button
                variant={showMinimap ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShowMinimap(!showMinimap)}
              >
                Minimap
              </Button>
            </div>

            {/* Action Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: 'Coming Soon',
                  description: 'Test functionality will be available soon',
                });
              }}
            >
              <Play className="h-4 w-4 mr-1" />
              Test
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Saving...' : 'Save'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  toast({
                    title: 'Coming Soon',
                    description: 'Duplicate functionality will be available soon',
                  });
                }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  toast({
                    title: 'Coming Soon',
                    description: 'Export functionality will be available soon',
                  });
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  toast({
                    title: 'Coming Soon',
                    description: 'Import functionality will be available soon',
                  });
                }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isNew}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Node Palette */}
        {showPalette && (
          <div className="border-r bg-background">
            <NodePalette onNodeSelect={handleNodeSelectFromPalette} />
          </div>
        )}

        {/* Workflow Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodesDelete={onNodesDelete}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionMode={ConnectionMode.Loose}
            fitView={false}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            deleteKeyCode="Delete"
            selectNodesOnDrag={false}
            panOnDrag={[1, 2]}
            panOnScroll={false}
            zoomOnScroll={true}
            zoomOnPinch={true}
            nodesDraggable={true}
            nodesConnectable={true}
            nodesFocusable={true}
            edgesFocusable={true}
            elementsSelectable={true}
          >
            {showGrid && <Background variant="dots" gap={16} size={1} color="#e5e7eb" />}
            <Controls showInteractive={false} />
            {showMinimap && (
              <MiniMap
                nodeStrokeColor={(node) => {
                  if (node.id === selectedNode?.id) return '#3b82f6';
                  return '#94a3b8';
                }}
                nodeColor={(node) => {
                  const category = node.data?.category;
                  const colors: Record<string, string> = {
                    triggers: '#22c55e',
                    ai: '#3b82f6',
                    logic: '#f59e0b',
                    actions: '#06b6d4',
                    data: '#8b5cf6',
                    utilities: '#6b7280',
                  };
                  return colors[category] || '#f3f4f6';
                }}
                maskColor="rgba(255, 255, 255, 0.8)"
              />
            )}
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        {selectedNode && selectedNodeData && (
          <div className="border-l bg-background">
            <NodePropertiesPanel
              node={selectedNode}
              nodeData={selectedNodeData}
              onUpdate={handleNodeUpdate}
              onClose={() => {
                setSelectedNode(null);
                setSelectedNodeData(null);
              }}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{workflow?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function WorkflowEditorPage() {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
}