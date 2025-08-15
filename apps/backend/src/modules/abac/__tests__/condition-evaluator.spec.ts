import { ConditionEvaluator } from '../condition-evaluator';

describe('ConditionEvaluator', () => {
  let evaluator: ConditionEvaluator;

  beforeEach(() => {
    evaluator = new ConditionEvaluator();
  });

  describe('equals condition', () => {
    it('should match when values are equal', () => {
      const result = evaluator.evaluate('admin', { equals: 'admin' });
      expect(result).toBe(true);
    });

    it('should not match when values are different', () => {
      const result = evaluator.evaluate('user', { equals: 'admin' });
      expect(result).toBe(false);
    });

    it('should handle string comparison case sensitivity', () => {
      const result = evaluator.evaluate('Admin', { equals: 'admin' });
      expect(result).toBe(false);
    });
  });

  describe('in condition', () => {
    it('should match when value is in array', () => {
      const result = evaluator.evaluate('manager', { in: ['admin', 'manager', 'employee'] });
      expect(result).toBe(true);
    });

    it('should not match when value is not in array', () => {
      const result = evaluator.evaluate('guest', { in: ['admin', 'manager', 'employee'] });
      expect(result).toBe(false);
    });

    it('should handle empty array', () => {
      const result = evaluator.evaluate('admin', { in: [] });
      expect(result).toBe(false);
    });
  });

  describe('not_in condition', () => {
    it('should match when value is not in array', () => {
      const result = evaluator.evaluate('guest', { not_in: ['admin', 'manager', 'employee'] });
      expect(result).toBe(true);
    });

    it('should not match when value is in array', () => {
      const result = evaluator.evaluate('admin', { not_in: ['admin', 'manager', 'employee'] });
      expect(result).toBe(false);
    });
  });

  describe('between condition', () => {
    it('should match when time is between range', () => {
      const result = evaluator.evaluate('14:30', { between: ['09:00', '17:00'] });
      expect(result).toBe(true);
    });

    it('should not match when time is outside range', () => {
      const result = evaluator.evaluate('22:00', { between: ['09:00', '17:00'] });
      expect(result).toBe(false);
    });

    it('should match when time equals start boundary', () => {
      const result = evaluator.evaluate('09:00', { between: ['09:00', '17:00'] });
      expect(result).toBe(true);
    });

    it('should match when time equals end boundary', () => {
      const result = evaluator.evaluate('17:00', { between: ['09:00', '17:00'] });
      expect(result).toBe(true);
    });

    it('should handle numeric ranges', () => {
      const result = evaluator.evaluate(5, { between: [1, 10] });
      expect(result).toBe(true);
    });
  });

  describe('not_between condition', () => {
    it('should match when time is outside range', () => {
      const result = evaluator.evaluate('22:00', { not_between: ['09:00', '17:00'] });
      expect(result).toBe(true);
    });

    it('should not match when time is inside range', () => {
      const result = evaluator.evaluate('14:30', { not_between: ['09:00', '17:00'] });
      expect(result).toBe(false);
    });
  });

  describe('contains condition', () => {
    it('should match when array contains value', () => {
      const result = evaluator.evaluate(['item1', 'item2', 'item3'], { contains: 'item2' });
      expect(result).toBe(true);
    });

    it('should not match when array does not contain value', () => {
      const result = evaluator.evaluate(['item1', 'item2', 'item3'], { contains: 'item4' });
      expect(result).toBe(false);
    });

    it('should match when string contains substring', () => {
      const result = evaluator.evaluate('hello world', { contains: 'world' });
      expect(result).toBe(true);
    });

    it('should handle empty array', () => {
      const result = evaluator.evaluate([], { contains: 'item' });
      expect(result).toBe(false);
    });
  });

  describe('contains_any condition', () => {
    it('should match when array contains any of the values', () => {
      const result = evaluator.evaluate(['red', 'blue'], { contains_any: ['blue', 'green'] });
      expect(result).toBe(true);
    });

    it('should not match when array contains none of the values', () => {
      const result = evaluator.evaluate(['red', 'yellow'], { contains_any: ['blue', 'green'] });
      expect(result).toBe(false);
    });

    it('should handle empty arrays', () => {
      const result = evaluator.evaluate([], { contains_any: ['item'] });
      expect(result).toBe(false);
    });
  });

  describe('exists condition', () => {
    it('should match when value exists and condition is true', () => {
      const result = evaluator.evaluate('some-value', { exists: true });
      expect(result).toBe(true);
    });

    it('should match when value does not exist and condition is false', () => {
      const result = evaluator.evaluate(undefined, { exists: false });
      expect(result).toBe(true);
    });

    it('should not match when value exists and condition is false', () => {
      const result = evaluator.evaluate('some-value', { exists: false });
      expect(result).toBe(false);
    });

    it('should not match when value does not exist and condition is true', () => {
      const result = evaluator.evaluate(null, { exists: true });
      expect(result).toBe(false);
    });
  });

  describe('greater_than condition', () => {
    it('should match when value is greater', () => {
      const result = evaluator.evaluate(10, { greater_than: 5 });
      expect(result).toBe(true);
    });

    it('should not match when value is equal', () => {
      const result = evaluator.evaluate(5, { greater_than: 5 });
      expect(result).toBe(false);
    });

    it('should not match when value is less', () => {
      const result = evaluator.evaluate(3, { greater_than: 5 });
      expect(result).toBe(false);
    });
  });

  describe('less_than condition', () => {
    it('should match when value is less', () => {
      const result = evaluator.evaluate(3, { less_than: 5 });
      expect(result).toBe(true);
    });

    it('should not match when value is equal', () => {
      const result = evaluator.evaluate(5, { less_than: 5 });
      expect(result).toBe(false);
    });

    it('should not match when value is greater', () => {
      const result = evaluator.evaluate(10, { less_than: 5 });
      expect(result).toBe(false);
    });
  });

  describe('multiple conditions', () => {
    it('should handle AND logic for multiple conditions', () => {
      const result = evaluator.evaluateAll('admin', {
        equals: 'admin',
        exists: true,
      });
      expect(result).toBe(true);
    });

    it('should fail when any condition fails in AND logic', () => {
      const result = evaluator.evaluateAll('admin', {
        equals: 'admin',
        exists: false,
      });
      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle null values', () => {
      const result = evaluator.evaluate(null, { equals: null });
      expect(result).toBe(true);
    });

    it('should handle undefined values', () => {
      const result = evaluator.evaluate(undefined, { exists: false });
      expect(result).toBe(true);
    });

    it('should handle boolean values', () => {
      const result = evaluator.evaluate(true, { equals: true });
      expect(result).toBe(true);
    });

    it('should handle numeric zero', () => {
      const result = evaluator.evaluate(0, { equals: 0 });
      expect(result).toBe(true);
    });

    it('should handle empty string', () => {
      const result = evaluator.evaluate('', { equals: '' });
      expect(result).toBe(true);
    });
  });
});
