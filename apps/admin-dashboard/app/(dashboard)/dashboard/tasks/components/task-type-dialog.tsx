'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { tasksApi, TaskType, CreateTaskTypeDto } from '@/lib/api/tasks';
import { Palette } from 'lucide-react';

interface TaskTypeDialogProps {
  taskType?: TaskType | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  isSuperAdmin?: boolean;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#6B7280', // Gray
];

const PRESET_ICONS = [
  '📝', '✅', '📋', '🎯', '🚀', '💡', '🔧', '📊',
  '📈', '🔍', '📧', '📞', '🗓️', '⏰', '🏆', '⭐',
];

export function TaskTypeDialog({ 
  taskType, 
  open, 
  onClose, 
  onSave,
  isSuperAdmin = false 
}: TaskTypeDialogProps) {
  const { toast } = useToast();
  const currentOrganization = useSelector((state: RootState) => state.organization.currentOrganization);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTaskTypeDto>({
    name: '',
    description: '',
    scope: 'organization',
    organizationId: currentOrganization?.id,
    icon: '',
    color: '',
    isActive: true,
    metadata: {},
  });

  useEffect(() => {
    if (taskType) {
      setFormData({
        name: taskType.name,
        description: taskType.description || '',
        scope: taskType.scope,
        organizationId: taskType.organizationId || currentOrganization?.id,
        icon: taskType.icon || '',
        color: taskType.color || '',
        isActive: taskType.isActive,
        metadata: taskType.metadata || {},
      });
    } else {
      setFormData({
        name: '',
        description: '',
        scope: 'organization',
        organizationId: currentOrganization?.id,
        icon: '',
        color: '',
        isActive: true,
        metadata: {},
      });
    }
  }, [taskType, currentOrganization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: 'Error',
        description: 'Please provide a name for the task type',
        variant: 'destructive',
      });
      return;
    }

    // Check if organization is selected when creating organization-scoped task type
    if (formData.scope === 'organization' && !currentOrganization?.id) {
      toast({
        title: 'Error',
        description: 'Please select an organization first',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        organizationId: formData.scope === 'organization' ? currentOrganization?.id : undefined,
      };
      console.log('Creating task type with data:', dataToSave);
      console.log('Current organization:', currentOrganization);
      console.log('Organization ID being sent:', dataToSave.organizationId);

      if (taskType) {
        await tasksApi.updateTaskType(taskType.id, dataToSave);
        toast({
          title: 'Success',
          description: 'Task type updated successfully',
        });
      } else {
        await tasksApi.createTaskType(dataToSave);
        toast({
          title: 'Success',
          description: 'Task type created successfully',
        });
      }
      onSave();
    } catch (error) {
      toast({
        title: 'Error',
        description: taskType ? 'Failed to update task type' : 'Failed to create task type',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const canEditScope = isSuperAdmin && !taskType;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{taskType ? 'Edit Task Type' : 'Create Task Type'}</DialogTitle>
          <DialogDescription>
            {taskType 
              ? 'Update the task type configuration below' 
              : 'Configure a new task type for your organization'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Bug Report, Feature Request"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose of this task type"
                rows={3}
              />
            </div>

            {canEditScope && (
              <div className="grid gap-2">
                <Label htmlFor="scope">Scope</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(value: 'system' | 'organization') => 
                    setFormData({ ...formData, scope: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organization">Organization</SelectItem>
                    <SelectItem value="system">System (All Organizations)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  System task types are available to all organizations
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="icon">Icon</Label>
                <div className="space-y-2">
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Enter emoji or icon"
                    maxLength={2}
                  />
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`p-2 rounded hover:bg-muted ${
                          formData.icon === icon ? 'bg-muted ring-2 ring-primary' : ''
                        }`}
                      >
                        <span className="text-xl">{icon}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color || '#3B82F6'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded border-2 ${
                          formData.color === color ? 'border-primary' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="active">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive task types cannot be used for new tasks
                </p>
              </div>
              <Switch
                id="active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            {formData.icon && formData.color && (
              <div className="p-4 border rounded-lg">
                <Label>Preview</Label>
                <div className="flex items-center gap-3 mt-2">
                  <div 
                    className="p-3 rounded-lg" 
                    style={{ backgroundColor: `${formData.color}20` }}
                  >
                    <span className="text-2xl">{formData.icon}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{formData.name || 'Task Type Name'}</div>
                    {formData.description && (
                      <div className="text-sm text-muted-foreground">
                        {formData.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : taskType ? 'Update Task Type' : 'Create Task Type'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}