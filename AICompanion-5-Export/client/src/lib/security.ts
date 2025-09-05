/**
 * Security utilities for safe user input handling
 * Prevents XSS and ensures data sanitization
 */
import { z } from 'zod';

/**
 * Escapes HTML special characters to prevent XSS
 */
export const escapeHtml = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitizes text content for safe rendering
 */
export const sanitizeText = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove any HTML tags and normalize whitespace
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
};

/**
 * Safe text content setter (alternative to innerHTML)
 */
export const setSafeTextContent = (element: HTMLElement, text: string): void => {
  element.textContent = sanitizeText(text);
};

/**
 * Common validation schemas with security constraints
 */
export const secureValidation = {
  // Personal name with reasonable length limits
  name: z.string()
    .min(1, 'Namn måste anges')
    .max(100, 'Namn får max vara 100 tecken')
    .regex(/^[a-zA-ZåäöÅÄÖ\s\-\.]+$/, 'Endast bokstäver, mellanslag, bindestreck och punkt tillåtna'),

  // Client initials format
  initials: z.string()
    .min(2, 'Initialer måste vara minst 2 tecken')
    .max(10, 'Initialer får max vara 10 tecken')
    .regex(/^[A-ZÅÄÖ\.]+$/, 'Endast versaler och punkt tillåtna'),

  // Plan number validation
  planNumber: z.string()
    .min(1, 'Vårdplansnummer måste anges')
    .max(20, 'Vårdplansnummer får max vara 20 tecken')
    .regex(/^[0-9A-Za-z\-_]+$/, 'Endast siffror, bokstäver, bindestreck och understreck tillåtna'),

  // Date validation
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum måste vara i format YYYY-MM-DD')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime()) && parsed.getFullYear() >= 1900 && parsed.getFullYear() <= 2100;
    }, 'Ogiltigt datum'),

  // Comment/text area with length limits
  comment: z.string()
    .max(2000, 'Kommentar får max vara 2000 tecken')
    .optional(),

  // Staff ID validation
  staffId: z.string()
    .uuid('Ogiltigt personal-ID format')
};

/**
 * Comprehensive form validation errors formatter
 */
export const formatValidationErrors = (errors: z.ZodError): string[] => {
  return errors.errors.map(error => {
    const field = error.path.join('.');
    return `${field}: ${error.message}`;
  });
};

/**
 * Safe logging that excludes sensitive data
 */
export const safeLog = (message: string, data?: Record<string, any>): void => {
  // Filter out potentially sensitive fields
  const sensitiveFields = ['password', 'personnummer', 'personalNumber', 'token', 'hash'];
  
  if (data) {
    const safData = Object.keys(data).reduce((acc, key) => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        acc[key] = '[REDACTED]';
      } else {
        acc[key] = data[key];
      }
      return acc;
    }, {} as Record<string, any>);
    
    console.log(message, safData);
  } else {
    console.log(message);
  }
};

/**
 * Create ARIA describedby IDs for form validation
 */
export const createFieldErrorId = (fieldName: string): string => {
  return `${fieldName}-error`;
};

/**
 * CSV-safe field escaping for exports
 */
export const escapeCsvField = (field: string | null | undefined): string => {
  if (!field) return '';
  
  const value = String(field);
  
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return sanitizeText(value);
};
