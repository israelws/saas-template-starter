import { clsx, type ClassValue } from 'clsx';

/**
 * Creates directional-aware class names
 * Automatically handles RTL/LTR variations
 */

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Common directional class replacements
export const dir = {
  // Margins
  ml: (value: string) => `ltr:ml-${value} rtl:mr-${value}`,
  mr: (value: string) => `ltr:mr-${value} rtl:ml-${value}`,
  ms: (value: string) => `ms-${value}`, // margin-inline-start
  me: (value: string) => `me-${value}`, // margin-inline-end
  
  // Paddings
  pl: (value: string) => `ltr:pl-${value} rtl:pr-${value}`,
  pr: (value: string) => `ltr:pr-${value} rtl:pl-${value}`,
  ps: (value: string) => `ps-${value}`, // padding-inline-start
  pe: (value: string) => `pe-${value}`, // padding-inline-end
  
  // Positioning
  left: (value: string) => `ltr:left-${value} rtl:right-${value}`,
  right: (value: string) => `ltr:right-${value} rtl:left-${value}`,
  
  // Text alignment
  textLeft: 'ltr:text-left rtl:text-right',
  textRight: 'ltr:text-right rtl:text-left',
  
  // Borders
  borderL: 'ltr:border-l rtl:border-r',
  borderR: 'ltr:border-r rtl:border-l',
  
  // Rounded corners
  roundedL: (value: string) => `ltr:rounded-l-${value} rtl:rounded-r-${value}`,
  roundedR: (value: string) => `ltr:rounded-r-${value} rtl:rounded-l-${value}`,
  
  // Flex direction
  flexRow: 'ltr:flex-row rtl:flex-row-reverse',
  
  // Space utilities
  spaceX: (value: string) => `ltr:space-x-${value} rtl:space-x-reverse rtl:space-x-${value}`,
};

// Helper function to apply directional classes
export function dirClass(ltrClass: string, rtlClass: string): string {
  return `ltr:${ltrClass} rtl:${rtlClass}`;
}