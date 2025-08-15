import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  Policy,
  PolicyEffect,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  TimeWindow,
  POLICY_EVALUATION_CACHE_TTL,
} from '@saas-template/shared';
import { PolicyService } from './policy.service';
import { AttributeService } from './attribute.service';
import { isTimeInWindow, getDayOfWeek } from '@saas-template/shared';
import { LoggerService } from '../../../common/logger/logger.service';
import { LogPerformance } from '../../../common/decorators/log.decorator';

@Injectable()
export class PolicyEvaluatorService {
  constructor(
    private readonly policyService: PolicyService,
    private readonly attributeService: AttributeService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('PolicyEvaluatorService');
  }

  @LogPerformance(100) // Log if evaluation takes more than 100ms
  async evaluate(context: PolicyEvaluationContext): Promise<PolicyEvaluationResult> {
    const startTime = Date.now();

    this.logger.debug({
      message: 'Starting policy evaluation',
      userId: context.subject.id,
      resource: context.resource,
      action: context.action,
    });

    // Check cache first
    const cacheKey = this.generateCacheKey(context);
    const cachedResult = await this.cacheManager.get<PolicyEvaluationResult>(cacheKey);

    if (cachedResult) {
      return {
        ...cachedResult,
        evaluationTime: Date.now() - startTime,
      };
    }

    // Get applicable policies
    const policies = await this.policyService.findApplicablePolicies(
      context.organizationId,
      context.resource.type,
    );

    // Evaluate each policy
    const matchedPolicies: Policy[] = [];
    const deniedPolicies: Policy[] = [];
    const reasons: string[] = [];

    for (const policy of policies) {
      const policyMatches = await this.evaluatePolicy(policy, context);

      if (policyMatches) {
        if (policy.effect === PolicyEffect.ALLOW) {
          matchedPolicies.push(policy);
          reasons.push(`Allowed by policy: ${policy.name}`);
        } else {
          deniedPolicies.push(policy);
          reasons.push(`Denied by policy: ${policy.name}`);
        }
      }
    }

    // Determine final result (deny takes precedence)
    const allowed = deniedPolicies.length === 0 && matchedPolicies.length > 0;

    const result: PolicyEvaluationResult = {
      allowed,
      matchedPolicies,
      deniedPolicies,
      reasons,
      evaluationTime: Date.now() - startTime,
    };

    // Log evaluation result
    this.logger.logPolicyEvaluation({
      userId: context.subject.id,
      resource: `${context.resource.type}:${context.resource.id || '*'}`,
      action: context.action,
      result: allowed ? 'allow' : 'deny',
      duration: result.evaluationTime,
      conditions: context,
    });

    // Log detailed info for denials
    if (!allowed && deniedPolicies.length > 0) {
      this.logger.warn({
        message: 'Access denied by policy',
        userId: context.subject.id,
        resource: context.resource,
        action: context.action,
        deniedPolicies: deniedPolicies.map((p) => ({ id: p.id, name: p.name })),
        reasons,
      });
    }

    // Cache the result
    await this.cacheManager.set(cacheKey, result, POLICY_EVALUATION_CACHE_TTL * 1000);

    return result;
  }

  private async evaluatePolicy(policy: Policy, context: PolicyEvaluationContext): Promise<boolean> {
    // Check if action matches
    if (!this.matchesAction(policy, context.action)) {
      return false;
    }

    // Check subjects
    if (!this.matchesSubjects(policy, context)) {
      return false;
    }

    // Check resources
    if (!this.matchesResources(policy, context)) {
      return false;
    }

    // Check conditions
    if (!(await this.matchesConditions(policy, context))) {
      return false;
    }

    return true;
  }

  private matchesAction(policy: Policy, action: string): boolean {
    // Check if policy actions include the requested action
    return policy.actions.includes(action) || policy.actions.includes('*');
  }

  private matchesSubjects(policy: Policy, context: PolicyEvaluationContext): boolean {
    const { subjects } = policy;
    const { subject } = context;

    // Check user ID
    if (subjects.users?.length) {
      if (!subjects.users.includes(subject.id) && !subjects.users.includes('*')) {
        return false;
      }
    }

    // Check roles
    if (subjects.roles?.length) {
      const hasMatchingRole = subjects.roles.some(
        (role) => subject.roles.includes(role) || role === '*',
      );
      if (!hasMatchingRole) {
        return false;
      }
    }

    // Check groups
    if (subjects.groups?.length) {
      const hasMatchingGroup = subjects.groups.some(
        (group) => subject.groups.includes(group) || group === '*',
      );
      if (!hasMatchingGroup) {
        return false;
      }
    }

    // Check subject attributes
    if (subjects.attributes) {
      if (!this.matchesAttributes(subjects.attributes, subject.attributes, context)) {
        return false;
      }
    }

    return true;
  }

  private matchesResources(policy: Policy, context: PolicyEvaluationContext): boolean {
    const { resources } = policy;
    const { resource } = context;

    // Check resource types
    if (resources.types?.length) {
      if (!resources.types.includes(resource.type) && !resources.types.includes('*')) {
        return false;
      }
    }

    // Check resource IDs
    if (resources.ids?.length && resource.id) {
      if (!resources.ids.includes(resource.id) && !resources.ids.includes('*')) {
        return false;
      }
    }

    // Check resource attributes
    if (resources.attributes) {
      if (!this.matchesAttributes(resources.attributes, resource.attributes, context)) {
        return false;
      }
    }

    return true;
  }

  private async matchesConditions(
    policy: Policy,
    context: PolicyEvaluationContext,
  ): Promise<boolean> {
    if (!policy.conditions) {
      return true;
    }

    const { conditions } = policy;
    const { environment } = context;

    // Check time window
    if (conditions.timeWindow) {
      if (!this.matchesTimeWindow(conditions.timeWindow, environment.timestamp)) {
        return false;
      }
    }

    // Check IP addresses
    if (conditions.ipAddresses?.length && environment.ipAddress) {
      if (!this.matchesIpAddress(conditions.ipAddresses, environment.ipAddress)) {
        return false;
      }
    }

    // Check locations
    if (conditions.locations?.length && environment.location) {
      if (!conditions.locations.includes(environment.location)) {
        return false;
      }
    }

    // Check custom conditions
    if (conditions.customConditions) {
      if (!(await this.evaluateCustomConditions(conditions.customConditions, context))) {
        return false;
      }
    }

    return true;
  }

  private matchesAttributes(
    policyAttributes: Record<string, any>,
    contextAttributes: Record<string, any>,
    context?: PolicyEvaluationContext,
  ): boolean {
    for (const [key, expectedValue] of Object.entries(policyAttributes)) {
      const actualValue = this.resolveAttributeValue(key, contextAttributes);

      // Resolve variables in expected value if context is provided
      const resolvedExpectedValue = context
        ? this.resolveVariables(expectedValue, context)
        : expectedValue;

      if (!this.compareAttributeValues(resolvedExpectedValue, actualValue)) {
        return false;
      }
    }

    return true;
  }

  private resolveAttributeValue(path: string, attributes: Record<string, any>): any {
    // Support nested attribute paths (e.g., "user.department")
    const parts = path.split('.');
    let value = attributes;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private compareAttributeValues(expected: any, actual: any): boolean {
    // Handle wildcards
    if (expected === '*') {
      return actual !== undefined;
    }

    // Handle arrays
    if (Array.isArray(expected)) {
      return expected.includes(actual);
    }

    // Handle regular expressions
    if (typeof expected === 'string' && expected.startsWith('/') && expected.endsWith('/')) {
      const regex = new RegExp(expected.slice(1, -1));
      return regex.test(String(actual));
    }

    // Handle objects (recursive comparison)
    if (typeof expected === 'object' && expected !== null) {
      if (typeof actual !== 'object' || actual === null) {
        return false;
      }
      return Object.entries(expected).every(([key, value]) =>
        this.compareAttributeValues(value, actual[key]),
      );
    }

    // Direct comparison
    return expected === actual;
  }

  private matchesTimeWindow(timeWindow: TimeWindow, timestamp: Date): boolean {
    // Check time of day
    if (timeWindow.start || timeWindow.end) {
      if (!isTimeInWindow(timestamp, timeWindow.start, timeWindow.end, timeWindow.timezone)) {
        return false;
      }
    }

    // Check days of week
    if (timeWindow.daysOfWeek?.length) {
      const dayOfWeek = getDayOfWeek(timestamp);
      if (!timeWindow.daysOfWeek.includes(dayOfWeek)) {
        return false;
      }
    }

    return true;
  }

  private matchesIpAddress(allowedIps: string[], clientIp: string): boolean {
    return allowedIps.some((allowedIp) => {
      // Support CIDR notation
      if (allowedIp.includes('/')) {
        return this.isIpInCidr(clientIp, allowedIp);
      }

      // Support wildcards
      if (allowedIp.includes('*')) {
        const regex = new RegExp('^' + allowedIp.replace(/\*/g, '.*') + '$');
        return regex.test(clientIp);
      }

      // Exact match
      return allowedIp === clientIp;
    });
  }

  private isIpInCidr(ip: string, cidr: string): boolean {
    // Simple CIDR check (can be enhanced with proper library)
    const [cidrIp, prefixLength] = cidr.split('/');
    const prefix = parseInt(prefixLength, 10);

    // For simplicity, only check if IPs match (full CIDR implementation would be more complex)
    return ip.startsWith(
      cidrIp
        .split('.')
        .slice(0, Math.floor(prefix / 8))
        .join('.'),
    );
  }

  private async evaluateCustomConditions(
    customConditions: Record<string, any>,
    context: PolicyEvaluationContext,
  ): Promise<boolean> {
    // Custom condition evaluation logic
    // This can be extended to support various custom conditions
    for (const [key, value] of Object.entries(customConditions)) {
      // Example: Check if a custom function returns true
      if (key === 'customFunction' && typeof value === 'string') {
        // In a real implementation, you might have a registry of custom functions
        // For now, we'll just return true
        return true;
      }
    }

    return true;
  }

  private generateCacheKey(context: PolicyEvaluationContext): string {
    // Generate a unique cache key based on the context
    const key = {
      subjectId: context.subject.id,
      resourceType: context.resource.type,
      resourceId: context.resource.id,
      action: context.action,
      organizationId: context.organizationId,
    };

    return `policy:eval:${JSON.stringify(key)}`;
  }

  /**
   * Resolves variables in values like ${subject.organizationId}
   */
  private resolveVariables(value: any, context: PolicyEvaluationContext): any {
    if (typeof value !== 'string') {
      return value;
    }

    // Check if the value contains variables
    if (!value.includes('${')) {
      return value;
    }

    // Replace all variables in the string
    return value.replace(/\$\{([^}]+)\}/g, (match, path) => {
      const resolved = this.resolveVariablePath(path, context);
      return resolved !== undefined ? resolved : match;
    });
  }

  /**
   * Resolves a variable path like "subject.organizationId" from the context
   */
  private resolveVariablePath(path: string, context: PolicyEvaluationContext): any {
    const parts = path.split('.');
    let current: any = context;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else if (part === 'self') {
        // Handle special "self" keyword
        current = context.subject;
      } else {
        // Try to resolve from subject attributes
        if (parts[0] === 'subject' && parts.length > 1) {
          const attrPath = parts.slice(1).join('.');
          return this.resolveAttributeValue(attrPath, context.subject.attributes);
        }
        return undefined;
      }
    }

    return current;
  }

  async clearCache(): Promise<void> {
    await this.cacheManager.clear();
  }

  async clearCacheForOrganization(organizationId: string): Promise<void> {
    // In a production system, you might want to use Redis with pattern matching
    // For now, we'll clear the entire cache
    await this.cacheManager.clear();
  }
}
