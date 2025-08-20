'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { TaskTypeForm } from '../../components/task-type-form';
import { tasksApi, TaskType } from '@/lib/api/tasks';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditTaskTypePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const taskTypeId = params.id as string;
  const isNew = taskTypeId === 'new';
  
  const user = useSelector((state: RootState) => state.auth.user);
  const currentOrganization = useSelector((state: RootState) => state.organization.currentOrganization);
  
  const [taskType, setTaskType] = useState<TaskType | undefined>(undefined);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!isNew) {
      loadTaskType();
    }
  }, [taskTypeId]);

  const loadTaskType = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getTaskType(taskTypeId);
      setTaskType(data);
    } catch (error) {
      console.error('Error loading task type:', error);
      toast({
        title: 'Error',
        description: 'Failed to load task type',
        variant: 'destructive',
      });
      router.push('/dashboard/tasks/types');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      if (isNew) {
        await tasksApi.createTaskType(formData);
        toast({
          title: 'Success',
          description: 'Task type created successfully',
        });
      } else {
        await tasksApi.updateTaskType(taskTypeId, formData);
        toast({
          title: 'Success',
          description: 'Task type updated successfully',
        });
      }
      router.push('/dashboard/tasks/types');
    } catch (error) {
      console.error('Error saving task type:', error);
      toast({
        title: 'Error',
        description: isNew ? 'Failed to create task type' : 'Failed to update task type',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/tasks/types');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isNew ? 'Create Task Type' : 'Edit Task Type'}
        </h1>
        <p className="text-muted-foreground">
          {isNew 
            ? 'Configure a new task type for your organization' 
            : 'Update the task type configuration and lifecycle'}
        </p>
      </div>
      
      <TaskTypeForm
        initialTaskType={taskType}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={saving}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}