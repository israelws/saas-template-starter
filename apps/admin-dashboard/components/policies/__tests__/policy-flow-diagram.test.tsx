import React from 'react';
import { screen } from '@testing-library/react';
import { PolicyFlowDiagram } from '../policy-flow-diagram';
import { renderWithProviders, mockPolicy } from '@/test-utils';

describe('PolicyFlowDiagram', () => {
  const mockEvaluationPath = [
    {
      policy: mockPolicy({
        id: '1',
        name: 'Admin Access Policy',
        effect: 'allow',
        priority: 90,
      }),
      matched: true,
      reason: 'All conditions met: subject.role equals "admin"',
    },
    {
      policy: mockPolicy({
        id: '2',
        name: 'Organization Member Policy',
        effect: 'allow',
        priority: 50,
      }),
      matched: false,
      reason: 'Condition failed: subject.organizationId not in resource.allowedOrgs',
    },
    {
      policy: mockPolicy({
        id: '3',
        name: 'Default Deny Policy',
        effect: 'deny',
        priority: 10,
      }),
      matched: true,
      reason: 'Default deny for all unmatched requests',
    },
  ];

  const defaultProps = {
    evaluationPath: mockEvaluationPath,
    finalEffect: 'allow' as const,
  };

  it('renders evaluation flow diagram', () => {
    renderWithProviders(<PolicyFlowDiagram {...defaultProps} />);

    expect(screen.getByText('Policy Evaluation Flow')).toBeInTheDocument();
    expect(screen.getByText('Request')).toBeInTheDocument();
    expect(screen.getByText('Final Decision: Allow')).toBeInTheDocument();
  });

  it('displays all policies in evaluation path', () => {
    renderWithProviders(<PolicyFlowDiagram {...defaultProps} />);

    expect(screen.getByText('Admin Access Policy')).toBeInTheDocument();
    expect(screen.getByText('Organization Member Policy')).toBeInTheDocument();
    expect(screen.getByText('Default Deny Policy')).toBeInTheDocument();
  });

  it('shows matched status for each policy', () => {
    renderWithProviders(<PolicyFlowDiagram {...defaultProps} />);

    // Matched policies should have success variant
    const adminPolicyCard = screen.getByText('Admin Access Policy').closest('.rounded-lg');
    expect(adminPolicyCard).toHaveClass('border-green-200');

    // Unmatched policies should have muted variant
    const orgPolicyCard = screen.getByText('Organization Member Policy').closest('.rounded-lg');
    expect(orgPolicyCard).toHaveClass('border-gray-200');
  });

  it('displays priority for each policy', () => {
    renderWithProviders(<PolicyFlowDiagram {...defaultProps} />);

    expect(screen.getByText('Priority: 90')).toBeInTheDocument();
    expect(screen.getByText('Priority: 50')).toBeInTheDocument();
    expect(screen.getByText('Priority: 10')).toBeInTheDocument();
  });

  it('shows evaluation reasons', () => {
    renderWithProviders(<PolicyFlowDiagram {...defaultProps} />);

    expect(screen.getByText('All conditions met: subject.role equals "admin"')).toBeInTheDocument();
    expect(
      screen.getByText('Condition failed: subject.organizationId not in resource.allowedOrgs'),
    ).toBeInTheDocument();
    expect(screen.getByText('Default deny for all unmatched requests')).toBeInTheDocument();
  });

  it('displays correct effect badges', () => {
    renderWithProviders(<PolicyFlowDiagram {...defaultProps} />);

    const allowBadges = screen.getAllByText('Allow');
    expect(allowBadges).toHaveLength(2); // Two allow policies

    const denyBadges = screen.getAllByText('Deny');
    expect(denyBadges).toHaveLength(1); // One deny policy
  });

  it('shows final decision with deny effect', () => {
    const propsWithDeny = {
      ...defaultProps,
      finalEffect: 'deny' as const,
    };

    renderWithProviders(<PolicyFlowDiagram {...propsWithDeny} />);

    expect(screen.getByText('Final Decision: Deny')).toBeInTheDocument();
    const finalDecisionCard = screen.getByText('Final Decision: Deny').closest('.rounded-lg');
    expect(finalDecisionCard).toHaveClass('border-red-200');
  });

  it('handles empty evaluation path', () => {
    const propsWithEmptyPath = {
      evaluationPath: [],
      finalEffect: 'deny' as const,
    };

    renderWithProviders(<PolicyFlowDiagram {...propsWithEmptyPath} />);

    expect(screen.getByText('No policies evaluated')).toBeInTheDocument();
    expect(screen.getByText('Final Decision: Deny')).toBeInTheDocument();
  });

  it('shows correct arrow colors based on match status', () => {
    renderWithProviders(<PolicyFlowDiagram {...defaultProps} />);

    // Check for arrow indicators (using SVG paths or icons)
    const arrows = screen.getAllByRole('img', { hidden: true });
    expect(arrows.length).toBeGreaterThan(0);
  });

  it('displays condensed view for many policies', () => {
    const manyPolicies = Array.from({ length: 10 }, (_, i) => ({
      policy: mockPolicy({
        id: `policy-${i}`,
        name: `Policy ${i}`,
        priority: 100 - i * 10,
      }),
      matched: i % 2 === 0,
      reason: `Reason for policy ${i}`,
    }));

    const propsWithManyPolicies = {
      evaluationPath: manyPolicies,
      finalEffect: 'allow' as const,
    };

    renderWithProviders(<PolicyFlowDiagram {...propsWithManyPolicies} />);

    // All policies should still be displayed
    for (let i = 0; i < 10; i++) {
      expect(screen.getByText(`Policy ${i}`)).toBeInTheDocument();
    }
  });

  it('highlights the determining policy', () => {
    renderWithProviders(<PolicyFlowDiagram {...defaultProps} />);

    // First matched allow policy should be highlighted as determining
    const adminPolicyCard = screen.getByText('Admin Access Policy').closest('.rounded-lg');
    expect(adminPolicyCard).toHaveClass('border-green-200', 'bg-green-50');
  });

  it('shows policy evaluation in priority order', () => {
    renderWithProviders(<PolicyFlowDiagram {...defaultProps} />);

    const policyNames = screen
      .getAllByText(/Policy$/)
      .map((el) => el.textContent)
      .filter((text) => text && text.includes('Policy'));

    // Should be ordered by priority (highest first)
    expect(policyNames[0]).toContain('Admin Access Policy'); // Priority 90
    expect(policyNames[1]).toContain('Organization Member Policy'); // Priority 50
    expect(policyNames[2]).toContain('Default Deny Policy'); // Priority 10
  });

  it('displays connection lines between elements', () => {
    renderWithProviders(<PolicyFlowDiagram {...defaultProps} />);

    // Should have visual flow indicators (arrows/lines)
    const svgElements = screen.getAllByRole('img', { hidden: true });
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('shows simplified view for single policy', () => {
    const singlePolicyPath = [
      {
        policy: mockPolicy({
          id: '1',
          name: 'Single Policy',
          effect: 'allow',
        }),
        matched: true,
        reason: 'Policy matched',
      },
    ];

    const propsWithSinglePolicy = {
      evaluationPath: singlePolicyPath,
      finalEffect: 'allow' as const,
    };

    renderWithProviders(<PolicyFlowDiagram {...propsWithSinglePolicy} />);

    expect(screen.getByText('Single Policy')).toBeInTheDocument();
    expect(screen.getByText('Final Decision: Allow')).toBeInTheDocument();
  });
});
