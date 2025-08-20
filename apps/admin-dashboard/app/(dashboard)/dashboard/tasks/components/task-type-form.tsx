'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { tasksApi, TaskType, CreateTaskTypeDto, TaskLifecycleEvent, CreateLifecycleEventDto } from '@/lib/api/tasks';
import {
  Bug,
  Zap,
  FileText,
  HelpCircle,
  Wrench,
  Target,
  Rocket,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Package,
  Users,
  Shield,
  Settings,
  Database,
  Cloud,
  Globe,
  Mail,
  Phone,
  MessageSquare,
  BarChart,
  TrendingUp,
  Award,
  Flag,
  Star,
  Heart,
  ThumbsUp,
  Coffee,
  Gift,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Briefcase,
  Home,
  Building,
  Map,
  Navigation,
  Bookmark,
  Archive,
  Trash2,
  Edit,
  Copy,
  Save,
  Download,
  Upload,
  RefreshCw,
  RotateCcw,
  Play,
  Pause,
  Square,
  Plus,
  Minus,
  X,
  Check,
  ChevronRight,
  ArrowRight,
  Workflow,
  GripVertical,
  Palette,
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

interface TaskTypeFormProps {
  initialTaskType?: TaskType;
  onSave: (taskType: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isSuperAdmin?: boolean;
}

const TASK_ICONS = [
  { icon: Bug, name: 'Bug', category: 'Task Types' },
  { icon: Zap, name: 'Feature', category: 'Task Types' },
  { icon: FileText, name: 'Documentation', category: 'Task Types' },
  { icon: HelpCircle, name: 'Support', category: 'Task Types' },
  { icon: Wrench, name: 'Maintenance', category: 'Task Types' },
  { icon: Target, name: 'Goal', category: 'Task Types' },
  { icon: Rocket, name: 'Launch', category: 'Task Types' },
  { icon: CheckCircle, name: 'Complete', category: 'Status' },
  { icon: XCircle, name: 'Cancelled', category: 'Status' },
  { icon: AlertTriangle, name: 'Warning', category: 'Status' },
  { icon: Info, name: 'Info', category: 'Status' },
  { icon: Clock, name: 'Time', category: 'Status' },
  { icon: Calendar, name: 'Schedule', category: 'Planning' },
  { icon: Flag, name: 'Priority', category: 'Planning' },
  { icon: Star, name: 'Favorite', category: 'Planning' },
  { icon: BarChart, name: 'Analytics', category: 'Data' },
  { icon: TrendingUp, name: 'Growth', category: 'Data' },
  { icon: Database, name: 'Database', category: 'Technical' },
  { icon: Cloud, name: 'Cloud', category: 'Technical' },
  { icon: Shield, name: 'Security', category: 'Technical' },
  { icon: Settings, name: 'Settings', category: 'Technical' },
  { icon: Package, name: 'Package', category: 'Technical' },
  { icon: Users, name: 'Team', category: 'Collaboration' },
  { icon: MessageSquare, name: 'Discussion', category: 'Collaboration' },
  { icon: Mail, name: 'Email', category: 'Collaboration' },
  { icon: Phone, name: 'Call', category: 'Collaboration' },
  { icon: DollarSign, name: 'Finance', category: 'Business' },
  { icon: ShoppingCart, name: 'Shopping', category: 'Business' },
  { icon: Briefcase, name: 'Business', category: 'Business' },
  { icon: CreditCard, name: 'Payment', category: 'Business' },
  { icon: Award, name: 'Achievement', category: 'Business' },
];

const PRESET_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Orange', value: '#FB923C' },
];

const LIFECYCLE_ICONS = [
  { icon: Play, name: 'Start' },
  { icon: Pause, name: 'Pause' },
  { icon: Square, name: 'Stop' },
  { icon: CheckCircle, name: 'Complete' },
  { icon: XCircle, name: 'Cancel' },
  { icon: RefreshCw, name: 'In Progress' },
  { icon: Clock, name: 'Waiting' },
  { icon: AlertTriangle, name: 'Blocked' },
  { icon: ArrowRight, name: 'Next' },
  { icon: RotateCcw, name: 'Reopen' },
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

  const IconComponent = LIFECYCLE_ICONS.find(i => i.name === event.icon)?.icon || Workflow;

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
                <IconComponent className="h-5 w-5" style={{ color: event.color || '#6B7280' }} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-base">{event.name}</span>
                  <div className="flex items-center gap-1">
                    {event.isInitial && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        Start
                      </Badge>
                    )}
                    {event.isFinal && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
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
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const TaskTypeForm: React.FC<TaskTypeFormProps> = ({
  initialTaskType,
  onSave,
  onCancel,
  isLoading = false,
  isSuperAdmin = false,
}) => {
  const { toast } = useToast();
  const currentOrganization = useSelector((state: RootState) => state.organization.currentOrganization);
  
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedIcon, setSelectedIcon] = useState<string>('Bug');
  const [formData, setFormData] = useState<CreateTaskTypeDto>({
    name: '',
    description: '',
    scope: 'organization',
    organizationId: currentOrganization?.id,
    icon: 'Bug',
    color: '#3B82F6',
    isActive: true,
    metadata: {},
  });

  // Lifecycle events state
  const [events, setEvents] = useState<TaskLifecycleEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<TaskLifecycleEvent | null>(null);
  const [isAddingNewEvent, setIsAddingNewEvent] = useState(false);
  const [eventFormData, setEventFormData] = useState<CreateLifecycleEventDto>({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'Start',
    isFinal: false,
    isInitial: false,
    allowedTransitions: [],
  });
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<TaskLifecycleEvent | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (initialTaskType) {
      setFormData({
        name: initialTaskType.name,
        description: initialTaskType.description || '',
        scope: initialTaskType.scope,
        organizationId: initialTaskType.organizationId || currentOrganization?.id,
        icon: initialTaskType.icon || 'Bug',
        color: initialTaskType.color || '#3B82F6',
        isActive: initialTaskType.isActive,
        metadata: initialTaskType.metadata || {},
      });
      setSelectedIcon(initialTaskType.icon || 'Bug');
      loadEvents();
    }
  }, [initialTaskType, currentOrganization]);

  const loadEvents = async () => {
    if (!initialTaskType?.id) return;
    try {
      const data = await tasksApi.getLifecycleEvents(initialTaskType.id);
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

      if (initialTaskType?.id) {
        try {
          await tasksApi.reorderLifecycleEvents(
            initialTaskType.id,
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
    }
  };

  const handleAddNewEvent = () => {
    setIsAddingNewEvent(true);
    setEditingEvent(null);
    setEventFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: 'Start',
      isFinal: false,
      isInitial: events.length === 0,
      allowedTransitions: [],
    });
  };

  const handleEditEvent = (event: TaskLifecycleEvent) => {
    setEditingEvent(event);
    setIsAddingNewEvent(false);
    setEventFormData({
      name: event.name,
      description: event.description || '',
      color: event.color || '#3B82F6',
      icon: event.icon || 'Start',
      isFinal: event.isFinal,
      isInitial: event.isInitial,
      allowedTransitions: event.allowedTransitions || [],
    });
  };

  const handleCancelEventEdit = () => {
    setEditingEvent(null);
    setIsAddingNewEvent(false);
    setEventFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: 'Start',
      isFinal: false,
      isInitial: false,
      allowedTransitions: [],
    });
  };

  const handleSaveEvent = async () => {
    if (!eventFormData.name) {
      toast({
        title: 'Error',
        description: 'Please provide a name for the event',
        variant: 'destructive',
      });
      return;
    }

    if (!initialTaskType?.id) {
      toast({
        title: 'Error',
        description: 'Please save the task type first before adding lifecycle events',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingEvent) {
        await tasksApi.updateLifecycleEvent(editingEvent.id, eventFormData);
        toast({
          title: 'Success',
          description: 'Lifecycle event updated',
        });
      } else {
        await tasksApi.createLifecycleEvent(initialTaskType.id, eventFormData);
        toast({
          title: 'Success',
          description: 'Lifecycle event created',
        });
      }
      loadEvents();
      handleCancelEventEdit();
    } catch (error) {
      toast({
        title: 'Error',
        description: editingEvent ? 'Failed to update event' : 'Failed to create event',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEvent = async (event: TaskLifecycleEvent) => {
    setDeleteConfirmEvent(event);
  };

  const confirmDeleteEvent = async () => {
    if (!deleteConfirmEvent) return;
    
    try {
      await tasksApi.deleteLifecycleEvent(deleteConfirmEvent.id);
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
    } finally {
      setDeleteConfirmEvent(null);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name) {
      toast({
        title: 'Error',
        description: 'Please provide a name for the task type',
        variant: 'destructive',
      });
      setActiveTab('basic');
      return false;
    }

    if (formData.scope === 'organization' && !currentOrganization?.id) {
      toast({
        title: 'Error',
        description: 'Please select an organization first',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const dataToSave = {
      ...formData,
      organizationId: formData.scope === 'organization' ? currentOrganization?.id : undefined,
    };

    onSave(dataToSave);
  };

  const canEditScope = isSuperAdmin && !initialTaskType;
  const SelectedIconComponent = TASK_ICONS.find(i => i.name === selectedIcon)?.icon || Bug;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="lifecycle" disabled={!initialTaskType}>
            Lifecycle Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Define the task type name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="text-base">
                      Active Status
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.isActive
                        ? 'Task type is active and can be used for new tasks'
                        : 'Task type is inactive and cannot be used'}
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visual Identity</CardTitle>
              <CardDescription>Choose an icon and color for this task type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Icon</Label>
                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    <div className="space-y-4">
                      {Array.from(new Set(TASK_ICONS.map(i => i.category))).map(category => (
                        <div key={category}>
                          <p className="text-sm font-medium text-muted-foreground mb-2">{category}</p>
                          <div className="grid grid-cols-8 gap-2">
                            {TASK_ICONS.filter(i => i.category === category).map(({ icon: IconComponent, name }) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => {
                                  setSelectedIcon(name);
                                  setFormData({ ...formData, icon: name });
                                }}
                                className={`p-2 rounded-lg border hover:bg-accent transition-colors ${
                                  selectedIcon === name ? 'border-primary bg-accent' : 'border-border'
                                }`}
                                title={name}
                              >
                                <IconComponent className="h-5 w-5" />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="grid gap-2">
                  <Label>Color</Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
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
                      {PRESET_COLORS.map(({ name, value }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: value })}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            formData.color === value ? 'border-primary scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: value }}
                          title={name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-muted/30">
                  <Label className="text-sm text-muted-foreground mb-3 block">Preview</Label>
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-3 rounded-lg flex items-center justify-center" 
                      style={{ backgroundColor: `${formData.color}20` }}
                    >
                      <SelectedIconComponent className="h-6 w-6" style={{ color: formData.color }} />
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifecycle" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lifecycle Events</CardTitle>
              <CardDescription>
                Define the workflow states for this task type. Tasks will progress through these states.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Events</h3>
                    {!isAddingNewEvent && !editingEvent && (
                      <Button size="sm" onClick={handleAddNewEvent}>
                        <Plus className="mr-2 h-3 w-3" />
                        Add Event
                      </Button>
                    )}
                  </div>

                  {events.length === 0 && !isAddingNewEvent ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <Workflow className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-4">
                          No lifecycle events defined
                        </p>
                        <Button size="sm" onClick={handleAddNewEvent}>
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
                              onEdit={handleEditEvent}
                              onDelete={handleDeleteEvent}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>

                {(isAddingNewEvent || editingEvent) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {editingEvent ? 'Edit Event' : 'New Event'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="event-name">Name *</Label>
                        <Input
                          id="event-name"
                          value={eventFormData.name}
                          onChange={(e) => setEventFormData({ ...eventFormData, name: e.target.value })}
                          placeholder="e.g., To Do, In Progress, Done"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="event-description">Description</Label>
                        <Textarea
                          id="event-description"
                          value={eventFormData.description}
                          onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                          placeholder="Describe this lifecycle state"
                          rows={2}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Icon</Label>
                        <div className="grid grid-cols-5 gap-2">
                          {LIFECYCLE_ICONS.map(({ icon: IconComponent, name }) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => setEventFormData({ ...eventFormData, icon: name })}
                              className={`p-2 rounded-lg border hover:bg-accent transition-colors ${
                                eventFormData.icon === name ? 'border-primary bg-accent' : 'border-border'
                              }`}
                              title={name}
                            >
                              <IconComponent className="h-4 w-4" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label>Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={eventFormData.color}
                            onChange={(e) => setEventFormData({ ...eventFormData, color: e.target.value })}
                            className="w-16 h-9"
                          />
                          <Input
                            value={eventFormData.color}
                            onChange={(e) => setEventFormData({ ...eventFormData, color: e.target.value })}
                            placeholder="#3B82F6"
                            className="flex-1"
                          />
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {PRESET_COLORS.map(({ value }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setEventFormData({ ...eventFormData, color: value })}
                              className={`w-7 h-7 rounded border-2 ${
                                eventFormData.color === value ? 'border-primary' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: value }}
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
                            checked={eventFormData.isInitial}
                            onCheckedChange={(checked) => setEventFormData({ ...eventFormData, isInitial: checked })}
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
                            checked={eventFormData.isFinal}
                            onCheckedChange={(checked) => setEventFormData({ ...eventFormData, isFinal: checked })}
                          />
                        </div>
                      </div>

                      {!eventFormData.isFinal && events.length > 0 && (
                        <div className="grid gap-2">
                          <Label>Allowed Transitions</Label>
                          <div className="space-y-2 border rounded-lg p-3">
                            {events
                              .filter(e => !editingEvent || e.id !== editingEvent.id)
                              .map(event => {
                                const EventIcon = LIFECYCLE_ICONS.find(i => i.name === event.icon)?.icon || Workflow;
                                return (
                                  <div key={event.id} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={eventFormData.allowedTransitions.includes(event.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setEventFormData({
                                            ...eventFormData,
                                            allowedTransitions: [...eventFormData.allowedTransitions, event.id],
                                          });
                                        } else {
                                          setEventFormData({
                                            ...eventFormData,
                                            allowedTransitions: eventFormData.allowedTransitions.filter(id => id !== event.id),
                                          });
                                        }
                                      }}
                                      className="h-4 w-4"
                                    />
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    <EventIcon className="h-4 w-4" style={{ color: event.color }} />
                                    <span className="text-sm">{event.name}</span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveEvent}
                          className="flex-1"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {editingEvent ? 'Update Event' : 'Save Event'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEventEdit}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : initialTaskType ? 'Update Task Type' : 'Create Task Type'}
        </Button>
      </div>

      <AlertDialog open={!!deleteConfirmEvent} onOpenChange={() => setDeleteConfirmEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lifecycle Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{deleteConfirmEvent?.name}" lifecycle event? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEvent} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};