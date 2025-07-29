/**
 * Utility functions for RTL/LTR support
 */

// Replace directional class names for RTL support
export function rtl(ltrClass: string, rtlClass: string): string {
  return `ltr:${ltrClass} rtl:${rtlClass}`;
}

// Common directional mappings
export const directionalClasses = {
  // Margin
  marginLeft: (value: string) => rtl(`ml-${value}`, `mr-${value}`),
  marginRight: (value: string) => rtl(`mr-${value}`, `ml-${value}`),
  marginStart: (value: string) => `ms-${value}`,
  marginEnd: (value: string) => `me-${value}`,
  
  // Padding
  paddingLeft: (value: string) => rtl(`pl-${value}`, `pr-${value}`),
  paddingRight: (value: string) => rtl(`pr-${value}`, `pl-${value}`),
  paddingStart: (value: string) => `ps-${value}`,
  paddingEnd: (value: string) => `pe-${value}`,
  
  // Position
  left: (value: string) => rtl(`left-${value}`, `right-${value}`),
  right: (value: string) => rtl(`right-${value}`, `left-${value}`),
  start: (value: string) => `start-${value}`,
  end: (value: string) => `end-${value}`,
  
  // Text alignment
  textLeft: () => rtl('text-left', 'text-right'),
  textRight: () => rtl('text-right', 'text-left'),
  textStart: () => 'text-start',
  textEnd: () => 'text-end',
  
  // Borders
  borderLeft: (value?: string) => rtl(`border-l${value ? `-${value}` : ''}`, `border-r${value ? `-${value}` : ''}`),
  borderRight: (value?: string) => rtl(`border-r${value ? `-${value}` : ''}`, `border-l${value ? `-${value}` : ''}`),
  borderStart: (value?: string) => `border-s${value ? `-${value}` : ''}`,
  borderEnd: (value?: string) => `border-e${value ? `-${value}` : ''}`,
  
  // Rounded corners
  roundedLeft: (value: string) => rtl(`rounded-l-${value}`, `rounded-r-${value}`),
  roundedRight: (value: string) => rtl(`rounded-r-${value}`, `rounded-l-${value}`),
  roundedStart: (value: string) => `rounded-s-${value}`,
  roundedEnd: (value: string) => `rounded-e-${value}`,
  
  // Flexbox
  flexRowReverse: () => rtl('flex-row', 'flex-row-reverse'),
  
  // Space
  spaceX: (value: string) => rtl(`space-x-${value}`, `space-x-reverse space-x-${value}`),
};

// Helper to convert icon rotation for RTL
export function getIconRotation(isRTL: boolean, baseRotation = 0): number {
  return isRTL ? 180 - baseRotation : baseRotation;
}

// Helper for directional icons
export function getDirectionalIcon(ltrIcon: string, rtlIcon: string, isRTL: boolean): string {
  return isRTL ? rtlIcon : ltrIcon;
}