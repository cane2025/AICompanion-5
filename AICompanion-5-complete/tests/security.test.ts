import { describe, it, expect, vi } from 'vitest';
import { 
  escapeHtml, 
  sanitizeText, 
  secureValidation, 
  formatValidationErrors,
  escapeCsvField,
  safeLog
} from '../client/src/lib/security';
import { z } from 'zod';

describe('Security Utils', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(escapeHtml(null as any)).toBe('');
    });

    it('should escape ampersands first', () => {
      expect(escapeHtml('&lt;test&gt;')).toBe('&amp;lt;test&amp;gt;');
    });
  });

  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeText('<p>Hello <b>world</b></p>')).toBe('Hello world');
    });

    it('should normalize whitespace', () => {
      expect(sanitizeText('  Hello   world  \n\t  ')).toBe('Hello world');
    });

    it('should handle empty strings', () => {
      expect(sanitizeText('')).toBe('');
    });
  });

  describe('secureValidation', () => {
    describe('name validation', () => {
      it('should accept valid Swedish names', () => {
        expect(() => secureValidation.name.parse('Anna Svensson')).not.toThrow();
        expect(() => secureValidation.name.parse('Lars-Erik Åström')).not.toThrow();
        expect(() => secureValidation.name.parse('Björn Ölsson')).not.toThrow();
      });

      it('should reject invalid characters', () => {
        expect(() => secureValidation.name.parse('Anna123')).toThrow();
        expect(() => secureValidation.name.parse('Anna<script>')).toThrow();
      });

      it('should enforce length limits', () => {
        expect(() => secureValidation.name.parse('')).toThrow();
        expect(() => secureValidation.name.parse('a'.repeat(101))).toThrow();
      });
    });

    describe('initials validation', () => {
      it('should accept valid initials', () => {
        expect(() => secureValidation.initials.parse('A.B.')).not.toThrow();
        expect(() => secureValidation.initials.parse('ABC')).not.toThrow();
      });

      it('should reject lowercase or invalid chars', () => {
        expect(() => secureValidation.initials.parse('a.b.')).toThrow();
        expect(() => secureValidation.initials.parse('A1B')).toThrow();
      });
    });

    describe('date validation', () => {
      it('should accept valid dates', () => {
        expect(() => secureValidation.date.parse('2025-01-15')).not.toThrow();
        expect(() => secureValidation.date.parse('1990-12-31')).not.toThrow();
      });

      it('should reject invalid date formats', () => {
        expect(() => secureValidation.date.parse('15-01-2025')).toThrow();
        expect(() => secureValidation.date.parse('2025/01/15')).toThrow();
        expect(() => secureValidation.date.parse('invalid-date')).toThrow();
      });

      it('should reject unrealistic dates', () => {
        expect(() => secureValidation.date.parse('1800-01-01')).toThrow();
        expect(() => secureValidation.date.parse('2200-01-01')).toThrow();
      });
    });

    describe('planNumber validation', () => {
      it('should accept valid plan numbers', () => {
        expect(() => secureValidation.planNumber.parse('1')).not.toThrow();
        expect(() => secureValidation.planNumber.parse('VP-2025-001')).not.toThrow();
      });

      it('should reject invalid characters', () => {
        expect(() => secureValidation.planNumber.parse('plan#1')).toThrow();
        expect(() => secureValidation.planNumber.parse('<script>')).toThrow();
      });
    });
  });

  describe('formatValidationErrors', () => {
    it('should format zod errors correctly', () => {
      const schema = z.object({
        name: z.string().min(1, 'Name required'),
        age: z.number().min(18, 'Must be adult')
      });

      try {
        schema.parse({ name: '', age: 10 });
      } catch (error) {
        const formatted = formatValidationErrors(error as z.ZodError);
        expect(formatted).toContain('name: Name required');
        expect(formatted).toContain('age: Must be adult');
      }
    });
  });

  describe('escapeCsvField', () => {
    it('should wrap fields with commas in quotes', () => {
      expect(escapeCsvField('test,value')).toBe('"test,value"');
    });

    it('should escape quotes in fields', () => {
      expect(escapeCsvField('test"value')).toBe('"test""value"');
    });

    it('should handle newlines', () => {
      expect(escapeCsvField('test\nvalue')).toBe('"test\nvalue"');
    });

    it('should handle null/undefined', () => {
      expect(escapeCsvField(null)).toBe('');
      expect(escapeCsvField(undefined)).toBe('');
    });

    it('should not wrap simple fields', () => {
      expect(escapeCsvField('simple')).toBe('simple');
    });
  });

  describe('safeLog', () => {
    it('should redact sensitive fields', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      safeLog('Test message', {
        name: 'John',
        password: 'secret123',
        personnummer: '123456-7890',
        token: 'abc123'
      });

      expect(consoleSpy).toHaveBeenCalledWith('Test message', {
        name: 'John',
        password: '[REDACTED]',
        personnummer: '[REDACTED]',
        token: '[REDACTED]'
      });

      consoleSpy.mockRestore();
    });
  });
});

// Test helper for form validation
describe('Form Validation Integration', () => {
  const carePlanSchema = z.object({
    socialWorkerName: secureValidation.name,
    clientInitials: secureValidation.initials,
    planNumber: secureValidation.planNumber,
    receivedDate: secureValidation.date,
    comment: secureValidation.comment
  });

  it('should validate complete valid form', () => {
    const validData = {
      socialWorkerName: 'Anna Svensson',
      clientInitials: 'A.B.',
      planNumber: '1',
      receivedDate: '2025-01-15',
      comment: 'Test comment'
    };

    expect(() => carePlanSchema.parse(validData)).not.toThrow();
  });

  it('should reject form with invalid data', () => {
    const invalidData = {
      socialWorkerName: '', // too short
      clientInitials: 'a.b.', // lowercase
      planNumber: '', // required
      receivedDate: 'invalid-date',
      comment: 'x'.repeat(3000) // too long
    };

    expect(() => carePlanSchema.parse(invalidData)).toThrow();
  });
});
