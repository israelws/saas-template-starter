import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { INodeData, INodeParam } from '@/lib/workflow/node-types';
import { Badge } from '@/components/ui/badge';

interface NodePropertiesPanelProps {
  node: any;
  nodeData: INodeData;
  onUpdate: (nodeId: string, data: any) => void;
  onClose: () => void;
}

export const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  node,
  nodeData,
  onUpdate,
  onClose,
}) => {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize form data from node data
    const initialData: any = {};
    nodeData.inputs?.forEach((input) => {
      initialData[input.name] = node.data[input.name] || input.default || '';
    });
    setFormData(initialData);
  }, [node, nodeData]);

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    nodeData.inputs?.forEach((input) => {
      if (!input.optional && !formData[input.name]) {
        newErrors[input.name] = `${input.label} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onUpdate(node.id, {
        ...node.data,
        ...formData,
        configured: true,
      });
      onClose();
    }
  };

  const renderInput = (input: INodeParam) => {
    const value = formData[input.name] || '';
    const error = errors[input.name];
    
    // Check if this input should be shown based on conditions
    if (input.show) {
      const shouldShow = Object.entries(input.show).every(([key, values]) => {
        return values.includes(formData[key]);
      });
      if (!shouldShow) return null;
    }

    switch (input.type) {
      case 'string':
        if (input.rows && input.rows > 1) {
          return (
            <div key={input.name} className="space-y-2">
              <Label htmlFor={input.name}>
                {input.label}
                {!input.optional && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Textarea
                id={input.name}
                value={value}
                onChange={(e) => handleInputChange(input.name, e.target.value)}
                placeholder={input.placeholder}
                rows={input.rows}
                className={error ? 'border-red-500' : ''}
              />
              {input.description && (
                <p className="text-xs text-muted-foreground">{input.description}</p>
              )}
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          );
        }
        return (
          <div key={input.name} className="space-y-2">
            <Label htmlFor={input.name}>
              {input.label}
              {!input.optional && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={input.name}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(input.name, e.target.value)}
              placeholder={input.placeholder}
              className={error ? 'border-red-500' : ''}
            />
            {input.description && (
              <p className="text-xs text-muted-foreground">{input.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={input.name} className="space-y-2">
            <Label htmlFor={input.name}>
              {input.label}
              {!input.optional && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={input.name}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(input.name, parseFloat(e.target.value))}
              placeholder={input.placeholder}
              className={error ? 'border-red-500' : ''}
            />
            {input.description && (
              <p className="text-xs text-muted-foreground">{input.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div key={input.name} className="flex items-center justify-between space-y-2">
            <div className="space-y-0.5">
              <Label htmlFor={input.name}>
                {input.label}
                {!input.optional && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {input.description && (
                <p className="text-xs text-muted-foreground">{input.description}</p>
              )}
            </div>
            <Switch
              id={input.name}
              checked={value === true}
              onCheckedChange={(checked) => handleInputChange(input.name, checked)}
            />
          </div>
        );

      case 'options':
        return (
          <div key={input.name} className="space-y-2">
            <Label htmlFor={input.name}>
              {input.label}
              {!input.optional && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleInputChange(input.name, val)}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={`Select ${input.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {input.options?.map((option) => (
                  <SelectItem key={option.name} value={option.name}>
                    {option.label}
                    {option.description && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {option.description}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {input.description && (
              <p className="text-xs text-muted-foreground">{input.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'code':
        return (
          <div key={input.name} className="space-y-2">
            <Label htmlFor={input.name}>
              {input.label}
              {!input.optional && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={input.name}
              value={value}
              onChange={(e) => handleInputChange(input.name, e.target.value)}
              placeholder={input.placeholder}
              rows={input.rows || 10}
              className={`font-mono text-xs ${error ? 'border-red-500' : ''}`}
              style={{ minHeight: '200px' }}
            />
            {input.description && (
              <p className="text-xs text-muted-foreground">{input.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'json':
        return (
          <div key={input.name} className="space-y-2">
            <Label htmlFor={input.name}>
              {input.label}
              {!input.optional && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={input.name}
              value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleInputChange(input.name, parsed);
                } catch {
                  handleInputChange(input.name, e.target.value);
                }
              }}
              placeholder={input.placeholder || '{}'}
              rows={input.rows || 6}
              className={`font-mono text-xs ${error ? 'border-red-500' : ''}`}
            />
            {input.description && (
              <p className="text-xs text-muted-foreground">{input.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case 'credential':
        return (
          <div key={input.name} className="space-y-2">
            <Label htmlFor={input.name}>
              {input.label}
              {!input.optional && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => handleInputChange(input.name, val)}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select credential" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">+ Add New Credential</SelectItem>
                {input.credentialNames?.map((cred) => (
                  <SelectItem key={cred} value={cred}>
                    {cred}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {input.description && (
              <p className="text-xs text-muted-foreground">{input.description}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  // Group inputs by type or show all in general tab
  const generalInputs = nodeData.inputs?.filter(
    (input) => !['credential'].includes(input.type)
  );
  const credentialInputs = nodeData.inputs?.filter(
    (input) => input.type === 'credential'
  );

  return (
    <Card className="w-96 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            {nodeData.icon && <span>{nodeData.icon}</span>}
            {nodeData.label}
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            {nodeData.description}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 p-0">
        <Tabs defaultValue="general" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 px-4 pt-2">
            <TabsTrigger value="general">General</TabsTrigger>
            {credentialInputs && credentialInputs.length > 0 && (
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
            )}
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="general" className="px-4 pb-4 space-y-4">
              {generalInputs?.map(renderInput)}
              {(!generalInputs || generalInputs.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No configuration required
                </p>
              )}
            </TabsContent>

            {credentialInputs && credentialInputs.length > 0 && (
              <TabsContent value="credentials" className="px-4 pb-4 space-y-4">
                {credentialInputs.map(renderInput)}
              </TabsContent>
            )}

            <TabsContent value="info" className="px-4 pb-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Node ID</Label>
                  <p className="text-sm font-mono">{node.id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p className="text-sm">{nodeData.type}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Badge variant="secondary">{nodeData.category}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Version</Label>
                  <p className="text-sm">v{nodeData.version}</p>
                </div>
                {nodeData.baseClasses && nodeData.baseClasses.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Base Classes</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {nodeData.baseClasses.map((cls) => (
                        <Badge key={cls} variant="outline" className="text-xs">
                          {cls}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {nodeData.inputAnchors && nodeData.inputAnchors.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Input Handles</Label>
                    <div className="space-y-1 mt-1">
                      {nodeData.inputAnchors.map((anchor) => (
                        <div key={anchor.id} className="text-xs">
                          • {anchor.label} ({anchor.type})
                          {anchor.optional && ' - Optional'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {nodeData.outputAnchors && nodeData.outputAnchors.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Output Handles</Label>
                    <div className="space-y-1 mt-1">
                      {nodeData.outputAnchors.map((anchor) => (
                        <div key={anchor.id} className="text-xs">
                          • {anchor.label} ({anchor.type})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>

          <div className="p-4 border-t mt-auto">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Save Changes
              </Button>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};