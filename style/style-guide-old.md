# STYLE_GUIDE.md - SAAS Template Starter Kit Style Guide

## Overview
This style guide ensures consistency across all parts of the SAAS Template Starter Kit. All developers must follow these guidelines to maintain code quality and visual consistency.

## Color System

### CSS Variables (Tailwind v4 Compatible)
```css
:root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0.2686 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.2686 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.2686 0 0);
  --primary: oklch(0.7686 0.1647 70.0804);
  --primary-foreground: oklch(0 0 0);
  --secondary: oklch(0.9670 0.0029 264.5419);
  --secondary-foreground: oklch(0.4461 0.0263 256.8018);
  --muted: oklch(0.9846 0.0017 247.8389);
  --muted-foreground: oklch(0.5510 0.0234 264.3637);
  --accent: oklch(0.9869 0.0214 95.2774);
  --accent-foreground: oklch(0.4732 0.1247 46.2007);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.9276 0.0058 264.5313);
  --input: oklch(0.9276 0.0058 264.5313);
  --ring: oklch(0.7686 0.1647 70.0804);
  --chart-1: oklch(0.7686 0.1647 70.0804);
  --chart-2: oklch(0.6658 0.1574 58.3183);
  --chart-3: oklch(0.5553 0.1455 48.9975);
  --chart-4: oklch(0.4732 0.1247 46.2007);
  --chart-5: oklch(0.4137 0.1054 45.9038);
  --sidebar: oklch(0.9846 0.0017 247.8389);
  --sidebar-foreground: oklch(0.2686 0 0);
  --sidebar-primary: oklch(0.7686 0.1647 70.0804);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.9869 0.0214 95.2774);
  --sidebar-accent-foreground: oklch(0.4732 0.1247 46.2007);
  --sidebar-border: oklch(0.9276 0.0058 264.5313);
  --sidebar-ring: oklch(0.7686 0.1647 70.0804);
  --font-sans: Inter, sans-serif;
  --font-serif: Source Serif 4, serif;
  --font-mono: JetBrains Mono, monospace;
  --radius: 0.375rem;
  --shadow-2xs: 0px 4px 8px -1px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0px 4px 8px -1px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 1px 2px -2px hsl(0 0% 0% / 0.10);
  --shadow: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 1px 2px -2px hsl(0 0% 0% / 0.10);
  --shadow-md: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 2px 4px -2px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 4px 6px -2px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 8px 10px -2px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0px 4px 8px -1px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2046 0 0);
  --foreground: oklch(0.9219 0 0);
  --card: oklch(0.2686 0 0);
  --card-foreground: oklch(0.9219 0 0);
  --popover: oklch(0.2686 0 0);
  --popover-foreground: oklch(0.9219 0 0);
  --primary: oklch(0.7686 0.1647 70.0804);
  --primary-foreground: oklch(0 0 0);
  --secondary: oklch(0.2686 0 0);
  --secondary-foreground: oklch(0.9219 0 0);
  --muted: oklch(0.2686 0 0);
  --muted-foreground: oklch(0.7155 0 0);
  --accent: oklch(0.4732 0.1247 46.2007);
  --accent-foreground: oklch(0.9243 0.1151 95.7459);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3715 0 0);
  --input: oklch(0.3715 0 0);
  --ring: oklch(0.7686 0.1647 70.0804);
  --chart-1: oklch(0.8369 0.1644 84.4286);
  --chart-2: oklch(0.6658 0.1574 58.3183);
  --chart-3: oklch(0.4732 0.1247 46.2007);
  --chart-4: oklch(0.5553 0.1455 48.9975);
  --chart-5: oklch(0.4732 0.1247 46.2007);
  --sidebar: oklch(0.1684 0 0);
  --sidebar-foreground: oklch(0.9219 0 0);
  --sidebar-primary: oklch(0.7686 0.1647 70.0804);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.4732 0.1247 46.2007);
  --sidebar-accent-foreground: oklch(0.9243 0.1151 95.7459);
  --sidebar-border: oklch(0.3715 0 0);
  --sidebar-ring: oklch(0.7686 0.1647 70.0804);
  --font-sans: Inter, sans-serif;
  --font-serif: Source Serif 4, serif;
  --font-mono: JetBrains Mono, monospace;
  --radius: 0.375rem;
  --shadow-2xs: 0px 4px 8px -1px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0px 4px 8px -1px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 1px 2px -2px hsl(0 0% 0% / 0.10);
  --shadow: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 1px 2px -2px hsl(0 0% 0% / 0.10);
  --shadow-md: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 2px 4px -2px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 4px 6px -2px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0px 4px 8px -1px hsl(0 0% 0% / 0.10), 0px 8px 10px -2px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0px 4px 8px -1px hsl(0 0% 0% / 0.25);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}
```

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Font Sizes
- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px)
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)
- `text-3xl`: 1.875rem (30px)
- `text-4xl`: 2.25rem (36px)

### Font Weights
- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 600
- `font-bold`: 700

## Spacing System

### Consistent Spacing Constants
```typescript
export const SPACING = {
  page: "p-6",
  card: "p-4",
  section: "space-y-6",
  form: "space-y-4"
}

export const LAYOUTS = {
  dashboard: "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
  form: "max-w-2xl mx-auto",
  table: "w-full"
}
```

### Spacing Scale
- `space-1`: 0.25rem (4px)
- `space-2`: 0.5rem (8px)
- `space-3`: 0.75rem (12px)
- `space-4`: 1rem (16px)
- `space-6`: 1.5rem (24px)
- `space-8`: 2rem (32px)

## Component Patterns

### Card Component Template
```typescript
export const CardTemplate = ({ title, children }) => (
  <Card className="p-6">
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    {children}
  </Card>
)
```

### Metric Card Pattern
```typescript
export function MetricCard({ title, value, change }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-gray-500">{change}</p>
      </CardContent>
    </Card>
  )
}
```

## Layout Patterns

### Dashboard Layout
```typescript
export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
```

## Form Styling

### Input Fields
- Always use labels with inputs
- Consistent spacing: `space-y-4` between form fields
- Error states with red border and text
- Disabled states with reduced opacity

### Buttons
- Primary: `bg-primary text-primary-foreground`
- Secondary: `bg-secondary text-secondary-foreground`
- Destructive: `bg-destructive text-destructive-foreground`
- Ghost: `hover:bg-accent hover:text-accent-foreground`

## Icons
- Use Lucide React for all icons
- Consistent size: `w-4 h-4` for inline, `w-5 h-5` for buttons
- Always include aria-labels for accessibility

## Responsive Design

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile-First Approach
Always design for mobile first, then enhance for larger screens.

## Animation and Transitions

### Standard Transitions
```css
transition-all duration-200 ease-in-out
```

### Hover States
- Scale: `hover:scale-105`
- Opacity: `hover:opacity-80`
- Background: Use accent colors

## Accessibility

### Required Practices
1. Use semantic HTML elements
2. Include ARIA labels where needed
3. Ensure color contrast meets WCAG AA standards
4. Support keyboard navigation
5. Include focus states for all interactive elements

### Focus States
```css
focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
```

## Code Formatting

### TypeScript/JavaScript
- Use 2 spaces for indentation
- Use single quotes for strings
- Always use semicolons
- Use async/await over promises
- Destructure objects when possible

### React Components
- Use functional components with hooks
- Props interface should be defined above component
- Use descriptive variable names
- Keep components under 200 lines

### CSS/Tailwind
- Group related utilities
- Order: layout → spacing → typography → colors → effects
- Use CSS variables for custom values
- Avoid arbitrary values when possible

## File Naming Conventions

### Components
- PascalCase: `UserProfile.tsx`
- Index files for folders: `index.ts`

### Utilities and Hooks
- camelCase: `useAuth.ts`, `formatDate.ts`

### Constants
- UPPER_SNAKE_CASE: `API_ENDPOINTS.ts`

### Styles
- kebab-case: `dashboard-layout.css`

## Git Commit Messages

### Format
```
type(scope): subject

body

footer
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

### Examples
```
feat(auth): add multi-factor authentication

- Implement TOTP-based 2FA
- Add QR code generation for authenticator apps
- Update user settings UI

Closes #123
```

## Error Handling

### User-Facing Errors
- Clear, actionable messages
- Avoid technical jargon
- Provide next steps
- Include error codes for support

### Toast Notifications
- Success: Green with checkmark icon
- Error: Red with X icon
- Warning: Yellow with alert icon
- Info: Blue with info icon

## Performance Guidelines

### Image Optimization
- Use WebP format when possible
- Implement lazy loading
- Provide appropriate alt text
- Use responsive images

### Code Splitting
- Lazy load routes
- Split vendor bundles
- Use dynamic imports for large components

### Caching
- Implement proper cache headers
- Use service workers for offline support
- Cache API responses appropriately

## Testing Standards

### Component Testing
- Test user interactions
- Test edge cases
- Mock external dependencies
- Aim for 80% coverage

### Naming Test Files
- Component tests: `ComponentName.test.tsx`
- Utility tests: `utilityName.test.ts`
- Integration tests: `feature.integration.test.ts`

---

This style guide is a living document and should be updated as the project evolves. All team members are responsible for maintaining consistency with these guidelines.