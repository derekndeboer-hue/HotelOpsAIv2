import { v4 as uuidv4 } from 'uuid';

/**
 * Format a Date to ISO date string (YYYY-MM-DD).
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format a Date to readable datetime string.
 */
export function formatDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Calculate duration in minutes between two dates.
 */
export function calculateDuration(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Generate a UUID v4.
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Determine the property zone based on room number.
 * Rooms 100-199 and 200-299 are in the Fleming wing.
 * Rooms 300+ are in the Simonton wing.
 */
export function getPropertyZone(roomNumber: string): 'fleming' | 'simonton' {
  const num = parseInt(roomNumber.replace(/\D/g, ''), 10);
  return num < 300 ? 'fleming' : 'simonton';
}
