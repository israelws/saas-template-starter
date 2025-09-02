'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Zap, Play, Pause, Settings, Copy, Trash2, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { workflowService } from '@/services/workflow.service';
import { WorkflowDialog } from '@/components/workflows/workflow-dialog';
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

interface Workflow {
  id: string;
  name: string;
  description?: string;
  triggerType: 'manual' | 'event' | 'scheduled' | 'api';
  entityType?: string;
  isActive: boolean;
  isTemplate: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  executionCount?: number;
  lastExecutedAt?: string;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const data = await workflowService.getAll();
      setWorkflows(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch workflows',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const handleCreateWorkflow = () => {
    setSelectedWorkflow(null);
    setDialogOpen(true);
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    router.push(`/dashboard/workflows/${workflow.id}`);
  };

  const handleToggleActive = async (workflow: Workflow) => {
    try {
      await workflowService.toggleActive(workflow.id);
      await fetchWorkflows();
      toast({
        title: 'Success',
        description: `Workflow ${workflow.isActive ? 'deactivated' : 'activated'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle workflow status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteWorkflow = async () => {
    if (!workflowToDelete) return;

    try {
      await workflowService.delete(workflowToDelete.id);
      await fetchWorkflows();
      toast({
        title: 'Success',
        description: 'Workflow deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete workflow',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    }
  };

  const confirmDelete = (workflow: Workflow) => {
    setWorkflowToDelete(workflow);
    setDeleteDialogOpen(true);
  };

  const handleCloneWorkflow = async (workflow: Workflow) => {
    try {
      await workflowService.cloneFromTemplate(workflow.id);
      await fetchWorkflows();
      toast({
        title: 'Success',
        description: 'Workflow cloned successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clone workflow',
        variant: 'destructive',
      });
    }
  };

  const getTriggerBadgeVariant = (triggerType: string) => {
    switch (triggerType) {
      case 'event':
        return 'default';
      case 'scheduled':
        return 'secondary';
      case 'api':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Workflows</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage intelligent automation workflows
          </p>
        </div>
        <Button onClick={handleCreateWorkflow}>
          <Plus className="h-4 w-4 mr-2" />
          New Workflow
        </Button>
      </div>

      {workflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first workflow to automate tasks with AI
            </p>
            <Button onClick={handleCreateWorkflow}>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    {workflow.description && (
                      <CardDescription className="mt-1">
                        {workflow.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEditWorkflow(workflow)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View & Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(workflow)}>
                        {workflow.isActive ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCloneWorkflow(workflow)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Clone
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => confirmDelete(workflow)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant={getTriggerBadgeVariant(workflow.triggerType)}>
                    {workflow.triggerType}
                  </Badge>
                  {workflow.entityType && (
                    <Badge variant="outline">{workflow.entityType}</Badge>
                  )}
                  {workflow.isTemplate && (
                    <Badge variant="secondary">Template</Badge>
                  )}
                  <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                    {workflow.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Version: {workflow.version}</p>
                  {workflow.executionCount !== undefined && (
                    <p>Executions: {workflow.executionCount}</p>
                  )}
                  {workflow.lastExecutedAt && (
                    <p>Last run: {new Date(workflow.lastExecutedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {dialogOpen && (
        <WorkflowDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          workflow={selectedWorkflow}
          onSuccess={(createdWorkflow) => {
            setDialogOpen(false);
            if (createdWorkflow?.id) {
              router.push(`/dashboard/workflows/${createdWorkflow.id}`);
            } else {
              fetchWorkflows();
            }
          }}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{workflowToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWorkflow}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}