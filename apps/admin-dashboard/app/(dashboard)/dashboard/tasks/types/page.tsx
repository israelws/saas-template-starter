'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setCurrentOrganization } from '@/store/slices/organizationSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { tasksApi, TaskType, TaskLifecycleEvent } from '@/lib/api/tasks';
import { TaskTypeDialog } from '../components/task-type-dialog';
import { LifecycleEventsDialog } from '../components/lifecycle-events-dialog';
import {
  Plus,
  Settings,
  Workflow,
  Building,
  Globe,
  Copy,
  Edit,
  Trash,
  MoreVertical,
  Palette,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

export default function TaskTypesPage() {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const currentOrganization = useSelector((state: RootState) => state.organization.currentOrganization);
  const user = useSelector((state: RootState) => state.auth.user);

  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskType, setSelectedTaskType] = useState<TaskType | null>(null);
  const [isTaskTypeDialogOpen, setIsTaskTypeDialogOpen] = useState(false);
  const [isLifecycleDialogOpen, setIsLifecycleDialogOpen] = useState(false);
  const [taskTypeToDelete, setTaskTypeToDelete] = useState<TaskType | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    // If no organization is selected, try to select the first one from user's memberships
    if (!currentOrganization && user?.memberships && user.memberships.length > 0) {
      const defaultMembership = user.memberships.find((m: any) => m.isDefault) || user.memberships[0];
      if (defaultMembership?.organization) {
        dispatch(setCurrentOrganization(defaultMembership.organization));
      }
    }
    loadTaskTypes();
  }, [currentOrganization?.id, user, dispatch]);

  const loadTaskTypes = async () => {
    try {
      setLoading(true);
      console.log('Loading task types for organization:', currentOrganization?.id);
      const data = await tasksApi.getTaskTypes(currentOrganization?.id);
      console.log('Loaded task types:', data);
      setTaskTypes(data);
    } catch (error) {
      console.error('Error loading task types:', error);
      toast({
        title: 'Error',
        description: 'Failed to load task types',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTaskType = () => {
    setSelectedTaskType(null);
    setIsTaskTypeDialogOpen(true);
  };

  const handleEditTaskType = (taskType: TaskType) => {
    setSelectedTaskType(taskType);
    setIsTaskTypeDialogOpen(true);
  };

  const handleConfigureLifecycle = (taskType: TaskType) => {
    setSelectedTaskType(taskType);
    setIsLifecycleDialogOpen(true);
  };

  const handleDuplicateTaskType = async (taskType: TaskType) => {
    try {
      const newName = `${taskType.name} (Copy)`;
      await tasksApi.duplicateTaskType(
        taskType.id,
        currentOrganization?.id || '',
        newName
      );
      toast({
        title: 'Success',
        description: 'Task type duplicated successfully',
      });
      loadTaskTypes();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate task type',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTaskType = async () => {
    if (!taskTypeToDelete) return;

    try {
      await tasksApi.deleteTaskType(taskTypeToDelete.id);
      toast({
        title: 'Success',
        description: 'Task type deleted successfully',
      });
      setTaskTypeToDelete(null);
      loadTaskTypes();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task type. It may have associated tasks.',
        variant: 'destructive',
      });
    }
  };

  const handleTaskTypeSaved = () => {
    loadTaskTypes();
    setIsTaskTypeDialogOpen(false);
    setSelectedTaskType(null);
  };

  const handleLifecycleSaved = () => {
    loadTaskTypes();
    setIsLifecycleDialogOpen(false);
    setSelectedTaskType(null);
  };

  const systemTaskTypes = taskTypes.filter(t => t.scope === 'system');
  const organizationTaskTypes = taskTypes.filter(t => t.scope === 'organization');

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Types</h1>
          <p className="text-muted-foreground">
            Configure task types and their lifecycle workflows
          </p>
        </div>
        <Button onClick={handleCreateTaskType}>
          <Plus className="mr-2 h-4 w-4" />
          New Task Type
        </Button>
      </div>

      {!currentOrganization && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-2 p-4">
            <Building className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Please select an organization from the top navigation to manage organization-specific task types.
            </p>
          </CardContent>
        </Card>
      )}

      {/* System Task Types */}
      {systemTaskTypes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">System Task Types</h2>
            <Badge variant="secondary">Available to all organizations</Badge>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {systemTaskTypes.map(taskType => (
              <Card key={taskType.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {taskType.icon && (
                        <div 
                          className="p-2 rounded-lg" 
                          style={{ backgroundColor: taskType.color ? `${taskType.color}20` : '#f0f0f0' }}
                        >
                          <span className="text-xl">{taskType.icon}</span>
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{taskType.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">System</Badge>
                          <span className="text-xs text-muted-foreground">All Organizations</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleConfigureLifecycle(taskType)}>
                          <Workflow className="mr-2 h-4 w-4" />
                          Configure Lifecycle
                        </DropdownMenuItem>
                        {isSuperAdmin && (
                          <>
                            <DropdownMenuItem onClick={() => handleEditTaskType(taskType)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setTaskTypeToDelete(taskType)}
                              className="text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDuplicateTaskType(taskType)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate for Organization
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {taskType.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {taskType.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Workflow className="h-3 w-3" />
                      {taskType.lifecycleEvents?.length || 0} Events
                    </div>
                    {taskType.color && (
                      <div className="flex items-center gap-1">
                        <Palette className="h-3 w-3" />
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: taskType.color }}
                        />
                      </div>
                    )}
                  </div>
                  {!taskType.isActive && (
                    <Badge variant="secondary" className="mt-2">Inactive</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Organization Task Types */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Organization Task Types</h2>
          <Badge variant="secondary">Specific to your organization</Badge>
        </div>
        
        {organizationTaskTypes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No organization-specific task types yet
              </p>
              <Button onClick={handleCreateTaskType}>
                <Plus className="mr-2 h-4 w-4" />
                Create Task Type
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizationTaskTypes.map(taskType => (
              <Card key={taskType.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {taskType.icon && (
                        <div 
                          className="p-2 rounded-lg" 
                          style={{ backgroundColor: taskType.color ? `${taskType.color}20` : '#f0f0f0' }}
                        >
                          <span className="text-xl">{taskType.icon}</span>
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{taskType.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">Organization</Badge>
                          {taskType.organization && (
                            <span className="text-xs text-muted-foreground">
                              {taskType.organization.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleConfigureLifecycle(taskType)}>
                          <Workflow className="mr-2 h-4 w-4" />
                          Configure Lifecycle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditTaskType(taskType)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateTaskType(taskType)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setTaskTypeToDelete(taskType)}
                          className="text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {taskType.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {taskType.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Workflow className="h-3 w-3" />
                      {taskType.lifecycleEvents?.length || 0} Events
                    </div>
                    {taskType.color && (
                      <div className="flex items-center gap-1">
                        <Palette className="h-3 w-3" />
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: taskType.color }}
                        />
                      </div>
                    )}
                  </div>
                  {!taskType.isActive && (
                    <Badge variant="secondary" className="mt-2">Inactive</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {isTaskTypeDialogOpen && (
        <TaskTypeDialog
          taskType={selectedTaskType}
          open={isTaskTypeDialogOpen}
          onClose={() => setIsTaskTypeDialogOpen(false)}
          onSave={handleTaskTypeSaved}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {isLifecycleDialogOpen && selectedTaskType && (
        <LifecycleEventsDialog
          taskType={selectedTaskType}
          open={isLifecycleDialogOpen}
          onClose={() => setIsLifecycleDialogOpen(false)}
          onSave={handleLifecycleSaved}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!taskTypeToDelete} onOpenChange={() => setTaskTypeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{taskTypeToDelete?.name}"? 
              This action cannot be undone and will fail if there are tasks using this type.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTaskType}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}