# COMPONENTS_REFERENCE.md

## Available shadcn/ui Components

### Core Components
- **Button**: Primary, Secondary, Destructive, Outline, Ghost, Link variants
- **Card**: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Input**: Standard text input with label support
- **Select**: Dropdown selection with search capability
- **Table**: Data display with sorting and filtering
- **Dialog**: Modal windows for confirmations and forms
- **Toast**: Notification system for user feedback
- **Form**: Form wrapper with validation support
- **Dashboard**: Pre-built dashboard layouts
- **Sidebar**: Navigation sidebar with collapsible sections

### Additional Components to Install as Needed
- **Alert**: Information and warning displays
- **Badge**: Status indicators and labels
- **Checkbox**: Multi-selection inputs
- **RadioGroup**: Single selection from multiple options
- **Switch**: Toggle switches for boolean values
- **Tabs**: Tabbed content organization
- **Tooltip**: Hover information displays
- **Popover**: Contextual overlays
- **Command**: Command palette / search interface
- **DataTable**: Advanced table with pagination
- **DatePicker**: Date selection component
- **Combobox**: Searchable select with autocomplete

## Import Pattern

```typescript
// Single component import
import { Button } from "@/components/ui/button"

// Multiple components from same file
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card"

// Form components
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form"

// Layout components
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Sidebar } from "@/components/ui/sidebar"
```

## Component Installation Commands

```bash
# Essential components for initial setup
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dashboard
npx shadcn-ui@latest add sidebar

# Additional components as needed
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add command
npx shadcn-ui@latest add data-table
npx shadcn-ui@latest add date-picker
npx shadcn-ui@latest add combobox
```

## Base Component Templates

### Card Template
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const BaseCard = ({ title, children, className = "" }) => (
  <Card className={`p-6 ${className}`}>
    <CardHeader>
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
)
```

### Form Field Template
```typescript
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export const TextField = ({ form, name, label, placeholder, ...props }) => (
  <FormField
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input placeholder={placeholder} {...field} {...props} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
)
```

### Data Table Template
```typescript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const DataTable = ({ columns, data }) => (
  <Table>
    <TableHeader>
      <TableRow>
        {columns.map((column) => (
          <TableHead key={column.key}>{column.header}</TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {data.map((row, index) => (
        <TableRow key={index}>
          {columns.map((column) => (
            <TableCell key={column.key}>
              {row[column.key]}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
```

## Component Usage Guidelines

### Buttons
```typescript
// Primary action
<Button>Save Changes</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Ghost button (no background)
<Button variant="ghost">Learn More</Button>

// With icon
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add New
</Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Saving...
</Button>
```

### Forms
```typescript
// Using react-hook-form with zod
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
})

const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: {
    name: "",
    email: "",
  },
})

// Form component
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
    <TextField 
      form={form} 
      name="name" 
      label="Name" 
      placeholder="Enter your name" 
    />
    <TextField 
      form={form} 
      name="email" 
      label="Email" 
      placeholder="Enter your email" 
      type="email"
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>
```

### Dialogs
```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to proceed with this action?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="secondary">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Toast Notifications
```typescript
import { useToast } from "@/components/ui/use-toast"

const { toast } = useToast()

// Success toast
toast({
  title: "Success",
  description: "Your changes have been saved.",
})

// Error toast
toast({
  title: "Error",
  description: "Something went wrong. Please try again.",
  variant: "destructive",
})
```

## Styling Guidelines

### Consistent Spacing
- Use Tailwind spacing utilities consistently
- Form fields: `space-y-4`
- Card sections: `space-y-6`
- Button groups: `space-x-2`

### Color Usage
- Use CSS variables defined in globals.css
- Primary actions: `bg-primary text-primary-foreground`
- Secondary actions: `bg-secondary text-secondary-foreground`
- Destructive actions: `bg-destructive text-destructive-foreground`

### Responsive Design
- Mobile-first approach
- Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`
- Test all components on various screen sizes

## Best Practices

1. **Always use the pre-built shadcn/ui components** when available instead of creating custom ones
2. **Follow the import pattern** specified above for consistency
3. **Use the base templates** as starting points for common patterns
4. **Maintain consistent spacing** using the defined spacing system
5. **Test components** in both light and dark modes
6. **Ensure accessibility** by using proper ARIA labels and keyboard navigation
7. **Keep components small and focused** - split large components into smaller ones
8. **Document any custom components** that extend shadcn/ui components

## Component Composition

When building complex UIs, compose smaller shadcn/ui components:

```typescript
// Organization card combining multiple components
export const OrganizationCard = ({ organization }) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>{organization.name}</CardTitle>
        <Badge variant={organization.active ? "default" : "secondary"}>
          {organization.active ? "Active" : "Inactive"}
        </Badge>
      </div>
      <CardDescription>{organization.type}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex items-center text-sm">
          <Users className="mr-2 h-4 w-4" />
          {organization.memberCount} members
        </div>
        <div className="flex items-center text-sm">
          <Building className="mr-2 h-4 w-4" />
          {organization.childrenCount} sub-organizations
        </div>
      </div>
    </CardContent>
  </Card>
)
```

## Updates and Maintenance

This reference should be updated whenever:
- New shadcn/ui components are added to the project
- Custom base components are created
- Import patterns change
- Best practices evolve

Last updated: [Current Date]