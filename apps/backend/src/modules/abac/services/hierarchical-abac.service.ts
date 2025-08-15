import { Injectable } from '@nestjs/common';
import { PolicyEvaluationContext, PolicyEvaluationResult, Policy } from '@saas-template/shared';
import { PolicyEvaluatorService } from './policy-evaluator.service';
import { PolicyService } from './policy.service';
import { OrganizationsService } from '../../organizations/organizations.service';

@Injectable()
export class HierarchicalAbacService {
  constructor(
    private readonly policyEvaluator: PolicyEvaluatorService,
    private readonly policyService: PolicyService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async evaluateWithHierarchy(context: PolicyEvaluationContext): Promise<PolicyEvaluationResult> {
    // First, evaluate policies at the current organization level
    const directResult = await this.policyEvaluator.evaluate(context);

    // If explicitly denied at current level, return immediately
    if (directResult.deniedPolicies.length > 0) {
      return directResult;
    }

    // If allowed at current level, return the result
    if (directResult.allowed) {
      return directResult;
    }

    // If not explicitly allowed or denied, check parent organizations
    const ancestors = await this.organizationsService.getAncestors(context.organizationId);

    for (const ancestor of ancestors) {
      // Skip the current organization (already evaluated)
      if (ancestor.id === context.organizationId) {
        continue;
      }

      // Create context for ancestor organization
      const ancestorContext: PolicyEvaluationContext = {
        ...context,
        organizationId: ancestor.id,
        environment: {
          ...context.environment,
          attributes: {
            ...context.environment.attributes,
            'env.isInheritedPolicy': true,
            'env.originalOrganizationId': context.organizationId,
          },
        },
      };

      const ancestorResult = await this.policyEvaluator.evaluate(ancestorContext);

      // If denied at any ancestor level, stop and return denial
      if (ancestorResult.deniedPolicies.length > 0) {
        return {
          ...ancestorResult,
          reasons: [
            ...ancestorResult.reasons,
            `Denied by inherited policy from organization: ${ancestor.name}`,
          ],
        };
      }

      // If allowed at ancestor level, return the result
      if (ancestorResult.allowed) {
        return {
          ...ancestorResult,
          reasons: [
            ...ancestorResult.reasons,
            `Allowed by inherited policy from organization: ${ancestor.name}`,
          ],
        };
      }
    }

    // No matching policies found in the hierarchy
    return {
      allowed: false,
      matchedPolicies: [],
      deniedPolicies: [],
      reasons: ['No matching policies found in organization hierarchy'],
      evaluationTime: directResult.evaluationTime,
    };
  }

  async evaluateCrossOrganization(
    context: PolicyEvaluationContext,
    targetOrganizationId: string,
  ): Promise<PolicyEvaluationResult> {
    // Check if there's a cross-organization policy that allows access
    const crossOrgContext: PolicyEvaluationContext = {
      ...context,
      resource: {
        ...context.resource,
        attributes: {
          ...context.resource.attributes,
          'resource.targetOrganizationId': targetOrganizationId,
        },
      },
      environment: {
        ...context.environment,
        attributes: {
          ...context.environment.attributes,
          'env.isCrossOrganizationAccess': true,
        },
      },
    };

    // First check policies in the user's organization
    const sourceResult = await this.evaluateWithHierarchy(crossOrgContext);

    if (!sourceResult.allowed) {
      return {
        ...sourceResult,
        reasons: [
          ...sourceResult.reasons,
          'Cross-organization access denied by source organization',
        ],
      };
    }

    // Then check policies in the target organization
    const targetContext: PolicyEvaluationContext = {
      ...crossOrgContext,
      organizationId: targetOrganizationId,
      subject: {
        ...context.subject,
        attributes: {
          ...context.subject.attributes,
          'user.sourceOrganizationId': context.organizationId,
        },
      },
    };

    const targetResult = await this.evaluateWithHierarchy(targetContext);

    if (!targetResult.allowed) {
      return {
        ...targetResult,
        reasons: [
          ...targetResult.reasons,
          'Cross-organization access denied by target organization',
        ],
      };
    }

    // Both organizations allow the access
    return {
      allowed: true,
      matchedPolicies: [...sourceResult.matchedPolicies, ...targetResult.matchedPolicies],
      deniedPolicies: [],
      reasons: [
        'Cross-organization access allowed by both organizations',
        ...sourceResult.reasons,
        ...targetResult.reasons,
      ],
      evaluationTime: sourceResult.evaluationTime + targetResult.evaluationTime,
    };
  }

  async getEffectivePolicies(
    userId: string,
    organizationId: string,
    resourceType?: string,
  ): Promise<Policy[]> {
    // Get all organizations in the hierarchy
    const organizations = [
      await this.organizationsService.findOne(organizationId),
      ...(await this.organizationsService.getAncestors(organizationId)),
    ];

    const allPolicies: Policy[] = [];

    for (const org of organizations) {
      const context: PolicyEvaluationContext = {
        subject: {
          id: userId,
          roles: [], // Would be populated from user service
          groups: [],
          attributes: {},
        },
        resource: {
          type: resourceType || '*',
          attributes: {},
        },
        action: '*',
        environment: {
          timestamp: new Date(),
          attributes: {},
        },
        organizationId: org.id,
      };

      // This is a simplified version - in production, you'd want to filter
      // policies more efficiently
      const policies = await this.policyService.findByOrganization(org.id);
      allPolicies.push(...policies);
    }

    return allPolicies;
  }
}
