/**
 * Condition evaluator for ABAC policy conditions
 */

export interface Condition {
  equals?: any;
  in?: any[];
  not_in?: any[];
  between?: [any, any];
  not_between?: [any, any];
  contains?: any;
  contains_any?: any[];
  exists?: boolean;
  greater_than?: number;
  less_than?: number;
  greater_than_or_equal?: number;
  less_than_or_equal?: number;
  starts_with?: string;
  ends_with?: string;
  matches?: string; // regex pattern
}

export class ConditionEvaluator {
  /**
   * Evaluate a single condition against a value
   */
  evaluate(value: any, condition: Condition): boolean {
    // Handle exists condition first since it checks for presence/absence
    if (condition.exists !== undefined) {
      const exists = value !== null && value !== undefined;
      return exists === condition.exists;
    }

    // Equals condition (handle before null check to allow null comparisons)
    if (condition.equals !== undefined) {
      return value === condition.equals;
    }

    // If value doesn't exist and we're not checking exists, return false
    if (value === null || value === undefined) {
      return false;
    }

    // In condition
    if (condition.in !== undefined) {
      return condition.in.includes(value);
    }

    // Not in condition
    if (condition.not_in !== undefined) {
      return !condition.not_in.includes(value);
    }

    // Between condition
    if (condition.between !== undefined) {
      const [min, max] = condition.between;
      return this.compareValues(value, min) >= 0 && this.compareValues(value, max) <= 0;
    }

    // Not between condition
    if (condition.not_between !== undefined) {
      const [min, max] = condition.not_between;
      return this.compareValues(value, min) < 0 || this.compareValues(value, max) > 0;
    }

    // Contains condition
    if (condition.contains !== undefined) {
      if (Array.isArray(value)) {
        return value.includes(condition.contains);
      }
      if (typeof value === 'string') {
        return value.includes(condition.contains);
      }
      return false;
    }

    // Contains any condition
    if (condition.contains_any !== undefined) {
      if (Array.isArray(value)) {
        return condition.contains_any.some((item) => value.includes(item));
      }
      return false;
    }

    // Greater than condition
    if (condition.greater_than !== undefined) {
      return this.compareValues(value, condition.greater_than) > 0;
    }

    // Less than condition
    if (condition.less_than !== undefined) {
      return this.compareValues(value, condition.less_than) < 0;
    }

    // Greater than or equal condition
    if (condition.greater_than_or_equal !== undefined) {
      return this.compareValues(value, condition.greater_than_or_equal) >= 0;
    }

    // Less than or equal condition
    if (condition.less_than_or_equal !== undefined) {
      return this.compareValues(value, condition.less_than_or_equal) <= 0;
    }

    // Starts with condition
    if (condition.starts_with !== undefined) {
      return typeof value === 'string' && value.startsWith(condition.starts_with);
    }

    // Ends with condition
    if (condition.ends_with !== undefined) {
      return typeof value === 'string' && value.endsWith(condition.ends_with);
    }

    // Matches regex condition
    if (condition.matches !== undefined) {
      if (typeof value === 'string') {
        const regex = new RegExp(condition.matches);
        return regex.test(value);
      }
      return false;
    }

    // No conditions matched
    return false;
  }

  /**
   * Evaluate all conditions (AND logic)
   */
  evaluateAll(value: any, conditions: Condition): boolean {
    const conditionKeys = Object.keys(conditions) as (keyof Condition)[];

    for (const key of conditionKeys) {
      const singleCondition: Condition = { [key]: conditions[key] };
      if (!this.evaluate(value, singleCondition)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Compare two values, handling different types
   */
  private compareValues(a: any, b: any): number {
    // Handle time strings (HH:MM format)
    if (
      typeof a === 'string' &&
      typeof b === 'string' &&
      this.isTimeString(a) &&
      this.isTimeString(b)
    ) {
      return this.compareTimeStrings(a, b);
    }

    // Handle dates
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() - b.getTime();
    }

    // Handle numbers
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    // Handle strings
    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b);
    }

    // Fallback to string comparison
    return String(a).localeCompare(String(b));
  }

  /**
   * Check if a string is in time format (HH:MM)
   */
  private isTimeString(str: string): boolean {
    return /^\d{1,2}:\d{2}$/.test(str);
  }

  /**
   * Compare time strings in HH:MM format
   */
  private compareTimeStrings(a: string, b: string): number {
    const [aHours, aMinutes] = a.split(':').map(Number);
    const [bHours, bMinutes] = b.split(':').map(Number);

    const aTotal = aHours * 60 + aMinutes;
    const bTotal = bHours * 60 + bMinutes;

    return aTotal - bTotal;
  }
}
