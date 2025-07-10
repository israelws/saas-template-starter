import { 
  generateCacheKey,
  sanitizeInput,
  parseTimeString,
  validateEmailFormat
} from '../string-utils';

describe('String Utils', () => {
  describe('generateCacheKey', () => {
    it('should generate cache key with prefix and parts', () => {
      const result = generateCacheKey('policy', ['org-123', 'user:read', 'read']);
      expect(result).toBe('policy:org-123:user:read:read');
    });

    it('should handle empty parts array', () => {
      const result = generateCacheKey('test', []);
      expect(result).toBe('test:');
    });

    it('should handle single part', () => {
      const result = generateCacheKey('user', ['123']);
      expect(result).toBe('user:123');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove harmful characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should preserve normal text', () => {
      const input = 'Hello World 123';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World 123');
    });

    it('should handle empty string', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });
  });

  describe('parseTimeString', () => {
    it('should parse valid time string', () => {
      const result = parseTimeString('14:30');
      expect(result).toEqual({ hours: 14, minutes: 30 });
    });

    it('should parse time with single digits', () => {
      const result = parseTimeString('9:05');
      expect(result).toEqual({ hours: 9, minutes: 5 });
    });

    it('should handle invalid time format', () => {
      expect(() => parseTimeString('invalid')).toThrow();
    });

    it('should handle out of range values', () => {
      expect(() => parseTimeString('25:30')).toThrow();
      expect(() => parseTimeString('12:60')).toThrow();
    });
  });

  describe('validateEmailFormat', () => {
    it('should validate correct email formats', () => {
      expect(validateEmailFormat('test@example.com')).toBe(true);
      expect(validateEmailFormat('user.name+tag@domain.co.uk')).toBe(true);
      expect(validateEmailFormat('user123@test-domain.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmailFormat('invalid-email')).toBe(false);
      expect(validateEmailFormat('@domain.com')).toBe(false);
      expect(validateEmailFormat('user@')).toBe(false);
      expect(validateEmailFormat('user@@domain.com')).toBe(false);
    });

    it('should handle empty and null inputs', () => {
      expect(validateEmailFormat('')).toBe(false);
      expect(validateEmailFormat(null)).toBe(false);
      expect(validateEmailFormat(undefined)).toBe(false);
    });
  });
});