'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { tasksApi, TaskType, TaskLifecycleEvent, CreateLifecycleEventDto } from '@/lib/api/tasks';
import {
  Plus,
  Edit,
  Trash,
  Save,
  X,
  MoveUp,
  MoveDown,
  ArrowRight,
  Flag,
  PlayCircle,
  CheckCircle2,
  Workflow,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LifecycleEventsDialogProps {
  taskType: TaskType;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface EventFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  isFinal: boolean;
  isInitial: boolean;
  allowedTransitions: string[];
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
  '🔵', '🟢', '🟡', '🔴', '🟣', '⚪', '⚫', '🟠',
  '▶️', '⏸️', '⏹️', '✅', '❌', '⚠️', '🔄', '⏳',
];

function SortableEventItem({ event, onEdit, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-3 border-l-4 hover:shadow-md transition-all duration-200" style={{ borderLeftColor: event.color || '#E5E5E5' }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div {...attributes} {...listeners} className="cursor-move opacity-50 hover:opacity-100 transition-opacity">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: event.color ? `${event.color}20` : '#f0f0f0' }}>
                {event.icon ? (
                  <span className="text-xl">{event.icon}</span>
                ) : (
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color || '#6B7280' }} />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-base">{event.name}</span>
                  <div className="flex items-center gap-1">
                    {event.isInitial && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        <PlayCircle className="mr-1 h-3 w-3" />
                        Start
                      </Badge>
                    )}
                    {event.isFinal && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        End
                      </Badge>
                    )}
                  </div>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 ml-4">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 hover:bg-accent"
                onClick={() => onEdit(event)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(event)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function LifecycleEventsDialog({ 
  taskType, 
  open, 
  onClose, 
  onSave 
}: LifecycleEventsDialogProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<TaskLifecycleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TaskLifecycleEvent | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '',
    isFinal: false,
    isInitial: false,
    allowedTransitions: [],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (open) {
      loadEvents();
    }
  }, [open, taskType.id]);

  const loadEvents = async () => {
    try {
      const data = await tasksApi.getLifecycleEvents(taskType.id);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load lifecycle events:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = events.findIndex(e => e.id === active.id);
      const newIndex = events.findIndex(e => e.id === over?.id);
      
      const newEvents = arrayMove(events, oldIndex, newIndex);
      setEvents(newEvents);

      try {
        await tasksApi.reorderLifecycleEvents(
          taskType.id,
          newEvents.map(e => e.id)
        );
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to reorder events',
          variant: 'destructive',
        });
        loadEvents();
      }
    }
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingEvent(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: '',
      isFinal: false,
      isInitial: events.length === 0,
      allowedTransitions: [],
    });
  };

  const handleEdit = (event: TaskLifecycleEvent) => {
    setEditingEvent(event);
    setIsAddingNew(false);
    setFormData({
      name: event.name,
      description: event.description || '',
      color: event.color || '#3B82F6',
      icon: event.icon || '',
      isFinal: event.isFinal,
      isInitial: event.isInitial,
      allowedTransitions: event.allowedTransitions || [],
    });
  };

  const handleCancel = () => {
    setEditingEvent(null);
    setIsAddingNew(false);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: '',
      isFinal: false,
      isInitial: false,
      allowedTransitions: [],
    });
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({
        title: 'Error',
        description: 'Please provide a name for the event',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (editingEvent) {
        await tasksApi.updateLifecycleEvent(editingEvent.id, formData);
        toast({
          title: 'Success',
          description: 'Lifecycle event updated',
        });
      } else {
        await tasksApi.createLifecycleEvent(taskType.id, formData);
        toast({
          title: 'Success',
          description: 'Lifecycle event created',
        });
      }
      loadEvents();
      handleCancel();
    } catch (error) {
      toast({
        title: 'Error',
        description: editingEvent ? 'Failed to update event' : 'Failed to create event',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (event: TaskLifecycleEvent) => {
    try {
      await tasksApi.deleteLifecycleEvent(event.id);
      toast({
        title: 'Success',
        description: 'Lifecycle event deleted',
      });
      loadEvents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    }
  };

  const handleAddTransition = (targetEventId: string) => {
    if (!formData.allowedTransitions.includes(targetEventId)) {
      setFormData({
        ...formData,
        allowedTransitions: [...formData.allowedTransitions, targetEventId],
      });
    }
  };

  const handleRemoveTransition = (targetEventId: string) => {
    setFormData({
      ...formData,
      allowedTransitions: formData.allowedTransitions.filter(id => id !== targetEventId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Lifecycle Events</DialogTitle>
          <DialogDescription>
            Define the workflow states for "{taskType.name}" tasks
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Events List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Lifecycle Events</h3>
              {!isAddingNew && !editingEvent && (
                <Button size="sm" onClick={handleAddNew}>
                  <Plus className="mr-2 h-3 w-3" />
                  Add Event
                </Button>
              )}
            </div>

            {events.length === 0 && !isAddingNew ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Workflow className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No lifecycle events defined
                  </p>
                  <Button size="sm" onClick={handleAddNew}>
                    <Plus className="mr-2 h-3 w-3" />
                    Add First Event
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={events.map(e => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {events.map(event => (
                      <SortableEventItem
                        key={event.id}
                        event={event}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Event Form */}
          {(isAddingNew || editingEvent) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingEvent ? 'Edit Event' : 'New Event'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., To Do, In Progress, Done"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this lifecycle state"
                    rows={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Icon</Label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Enter emoji"
                    maxLength={2}
                  />
                  <div className="flex gap-1 flex-wrap">
                    {PRESET_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`p-1 rounded hover:bg-muted ${
                          formData.icon === icon ? 'bg-muted ring-2 ring-primary' : ''
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-9"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-6 h-6 rounded border-2 ${
                          formData.color === color ? 'border-primary' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Initial State</Label>
                      <p className="text-xs text-muted-foreground">
                        Tasks start in this state
                      </p>
                    </div>
                    <Switch
                      checked={formData.isInitial}
                      onCheckedChange={(checked) => setFormData({ ...formData, isInitial: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Final State</Label>
                      <p className="text-xs text-muted-foreground">
                        Tasks cannot transition from this state
                      </p>
                    </div>
                    <Switch
                      checked={formData.isFinal}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFinal: checked })}
                    />
                  </div>
                </div>

                {!formData.isFinal && events.length > 0 && (
                  <div className="grid gap-2">
                    <Label>Allowed Transitions</Label>
                    <div className="space-y-2 border rounded-lg p-3">
                      {events
                        .filter(e => !editingEvent || e.id !== editingEvent.id)
                        .map(event => (
                          <div key={event.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.allowedTransitions.includes(event.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleAddTransition(event.id);
                                } else {
                                  handleRemoveTransition(event.id);
                                }
                              }}
                              className="h-4 w-4"
                            />
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            {event.icon && <span>{event.icon}</span>}
                            <span className="text-sm">{event.name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Event'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}