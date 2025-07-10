import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PolicyTester } from '../policy-tester';
import { renderWithProviders, mockPolicy } from '@/test-utils';

describe('PolicyTester', () => {
  const mockPolicies = [
    mockPolicy({ name: 'Policy 1' }),
    mockPolicy({ id: 'policy-2', name: 'Policy 2', effect: 'deny' }),
  ];

  const mockAvailableAttributes = [
    {
      key: 'subject.role',
      name: 'User Role',
      type: 'string',
      category: 'subject' as const,
    },
    {
      key: 'resource.type',
      name: 'Resource Type',
      type: 'string',
      category: 'resource' as const,
    },
  ];

  const mockTestResult = {
    allowed: true,
    matchedPolicies: [mockPolicies[0]],
    evaluationPath: [
      {
        policy: mockPolicies[0],
        matched: true,
        reason: 'All conditions met',
      },
      {
        policy: mockPolicies[1],
        matched: false,
        reason: 'Resource does not match',
      },
    ],
    finalEffect: 'allow' as const,
  };

  const defaultProps = {
    policies: mockPolicies,
    availableAttributes: mockAvailableAttributes,
    onTest: jest.fn().mockResolvedValue(mockTestResult),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders test context form', () => {
    renderWithProviders(<PolicyTester {...defaultProps} />);

    expect(screen.getByLabelText('Resource Path')).toBeInTheDocument();
    expect(screen.getByLabelText('Action')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Subject/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Resource/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Environment/i })).toBeInTheDocument();
  });

  it('adds and removes attributes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyTester {...defaultProps} />);

    // Add subject attribute
    await user.click(screen.getByText('Add Attribute'));

    // Should show attribute editor
    expect(screen.getByText('Select attribute')).toBeInTheDocument();

    // Remove attribute
    const removeButton = screen.getByRole('button', { name: /trash/i });
    await user.click(removeButton);

    // Should show empty state again
    expect(screen.getByText('No subject attributes defined')).toBeInTheDocument();
  });

  it('switches between attribute tabs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyTester {...defaultProps} />);

    // Initially on subject tab
    expect(screen.getByText('Define subject attributes for the test context')).toBeInTheDocument();

    // Switch to resource tab
    await user.click(screen.getByRole('tab', { name: /Resource/i }));
    expect(screen.getByText('Define resource attributes for the test context')).toBeInTheDocument();

    // Switch to environment tab
    await user.click(screen.getByRole('tab', { name: /Environment/i }));
    expect(
      screen.getByText('Define environment attributes for the test context'),
    ).toBeInTheDocument();
  });

  it('runs test with valid context', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyTester {...defaultProps} />);

    // Fill in required fields
    await user.type(screen.getByLabelText('Resource Path'), 'organization:read');
    await user.type(screen.getByLabelText('Action'), 'read');

    // Add subject attribute
    await user.click(screen.getByText('Add Attribute'));
    const attributeSelect = screen.getByText('Select attribute');
    await user.click(attributeSelect);
    await user.click(screen.getByText('User Role'));
    await user.type(screen.getByPlaceholderText('Value'), 'admin');

    // Run test
    await user.click(screen.getByText('Run Test'));

    await waitFor(() => {
      expect(defaultProps.onTest).toHaveBeenCalledWith({
        subject: [{ key: 'subject.role', value: 'admin' }],
        resource: [],
        environment: [],
        action: 'read',
        resourcePath: 'organization:read',
      });
    });
  });

  it('displays test results', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyTester {...defaultProps} />);

    // Run test
    await user.type(screen.getByLabelText('Resource Path'), 'organization:read');
    await user.type(screen.getByLabelText('Action'), 'read');
    await user.click(screen.getByText('Run Test'));

    await waitFor(() => {
      // Result header
      expect(screen.getByText('Access Allowed')).toBeInTheDocument();
      expect(screen.getByText(/The request would be allowed/i)).toBeInTheDocument();

      // Matched policies
      expect(screen.getByText('Matched Policies')).toBeInTheDocument();
      expect(screen.getByText('Policy 1')).toBeInTheDocument();

      // Evaluation path
      expect(screen.getByText('Evaluation Path')).toBeInTheDocument();
      expect(screen.getByText('All conditions met')).toBeInTheDocument();
    });
  });

  it('shows denied result', async () => {
    const deniedResult = {
      ...mockTestResult,
      allowed: false,
      finalEffect: 'deny' as const,
    };

    const propsWithDeniedResult = {
      ...defaultProps,
      onTest: jest.fn().mockResolvedValue(deniedResult),
    };

    const user = userEvent.setup();
    renderWithProviders(<PolicyTester {...propsWithDeniedResult} />);

    await user.type(screen.getByLabelText('Resource Path'), 'organization:write');
    await user.type(screen.getByLabelText('Action'), 'write');
    await user.click(screen.getByText('Run Test'));

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/The request would be denied/i)).toBeInTheDocument();
    });
  });

  it('exports test case', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyTester {...defaultProps} />);

    // Create a mock for URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');

    // Mock createElement to capture the download link
    const mockClick = jest.fn();
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

    // Run test first
    await user.type(screen.getByLabelText('Resource Path'), 'organization:read');
    await user.type(screen.getByLabelText('Action'), 'read');
    await user.click(screen.getByText('Run Test'));

    await waitFor(() => {
      expect(screen.getByText('Export Test Case')).toBeInTheDocument();
    });

    // Export test case
    await user.click(screen.getByText('Export Test Case'));

    expect(mockAnchor.download).toBe('policy-test-case.json');
    expect(mockClick).toHaveBeenCalled();
  });

  it('disables run test button when fields are empty', () => {
    renderWithProviders(<PolicyTester {...defaultProps} />);

    const runButton = screen.getByText('Run Test');
    expect(runButton).toBeDisabled();
  });

  it('enables run test button when required fields are filled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyTester {...defaultProps} />);

    const runButton = screen.getByText('Run Test');
    expect(runButton).toBeDisabled();

    await user.type(screen.getByLabelText('Resource Path'), 'organization:read');
    await user.type(screen.getByLabelText('Action'), 'read');

    expect(runButton).toBeEnabled();
  });

  it('shows loading state during test', async () => {
    const slowTest = new Promise((resolve) => setTimeout(() => resolve(mockTestResult), 100));
    const propsWithSlowTest = {
      ...defaultProps,
      onTest: jest.fn().mockReturnValue(slowTest),
    };

    const user = userEvent.setup();
    renderWithProviders(<PolicyTester {...propsWithSlowTest} />);

    await user.type(screen.getByLabelText('Resource Path'), 'organization:read');
    await user.type(screen.getByLabelText('Action'), 'read');
    await user.click(screen.getByText('Run Test'));

    expect(screen.getByText('Running Test...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Access Allowed')).toBeInTheDocument();
    });
  });

  it('handles test errors gracefully', async () => {
    const propsWithError = {
      ...defaultProps,
      onTest: jest.fn().mockRejectedValue(new Error('Test failed')),
    };

    const user = userEvent.setup();
    renderWithProviders(<PolicyTester {...propsWithError} />);

    await user.type(screen.getByLabelText('Resource Path'), 'organization:read');
    await user.type(screen.getByLabelText('Action'), 'read');
    await user.click(screen.getByText('Run Test'));

    // Should not show results on error
    await waitFor(() => {
      expect(screen.queryByText('Access Allowed')).not.toBeInTheDocument();
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
    });
  });
});
