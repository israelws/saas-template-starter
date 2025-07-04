/**
 * Date utility functions
 */

export function formatDate(date: Date | string, format?: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (!format) {
    return d.toISOString();
  }
  
  // Simple date formatting (can be enhanced with date-fns or moment.js later)
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

export function isTimeInWindow(
  date: Date,
  startTime?: string,
  endTime?: string,
  timezone?: string,
): boolean {
  if (!startTime || !endTime) {
    return true;
  }
  
  // For now, simple time comparison. In production, use a proper timezone library
  const currentHours = date.getHours();
  const currentMinutes = date.getMinutes();
  
  const start = parseTimeString(startTime);
  const end = parseTimeString(endTime);
  
  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  const startTotalMinutes = start.hours * 60 + start.minutes;
  const endTotalMinutes = end.hours * 60 + end.minutes;
  
  if (startTotalMinutes <= endTotalMinutes) {
    return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes;
  } else {
    // Handle overnight windows
    return currentTotalMinutes >= startTotalMinutes || currentTotalMinutes <= endTotalMinutes;
  }
}