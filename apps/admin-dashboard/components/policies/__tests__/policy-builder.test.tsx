import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PolicyBuilder } from '../policy-builder';
import { renderWithProviders, mockPolicy } from '@/test-utils';

describe('PolicyBuilder', () => {
  const mockAvailableAttributes = [
    {
      key: 'subject.role',
      name: 'User Role',
      type: 'string',
      category: 'subject' as const,
    },
    {
      key: 'resource.owner',
      name: 'Resource Owner',
      type: 'string',
      category: 'resource' as const,
    },
    {
      key: 'environment.time',
      name: 'Time',
      type: 'string',
      category: 'environment' as const,
    },
  ];

  const defaultProps = {
    onSave: jest.fn(),
    onCancel: jest.fn(),
    availableAttributes: mockAvailableAttributes,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders basic policy fields', () => {
    renderWithProviders(<PolicyBuilder {...defaultProps} />);

    expect(screen.getByLabelText(/Policy Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
  });

  it('renders policy rules fields', () => {
    renderWithProviders(<PolicyBuilder {...defaultProps} />);

    expect(screen.getByLabelText(/Resource/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Action/i)).toBeInTheDocument();
    expect(screen.getByText(/Policy Effect/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyBuilder {...defaultProps} />);

    const saveButton = screen.getByText('Save Policy');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Policy name is required')).toBeInTheDocument();
      expect(screen.getByText('Resource is required')).toBeInTheDocument();
      expect(screen.getByText('Action is required')).toBeInTheDocument();
    });

    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('validates priority range', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyBuilder {...defaultProps} />);

    const priorityInput = screen.getByLabelText(/Priority/i);
    await user.clear(priorityInput);
    await user.type(priorityInput, '150');

    const saveButton = screen.getByText('Save Policy');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Priority must be between 0 and 100')).toBeInTheDocument();
    });
  });

  it('fills and submits form with valid data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyBuilder {...defaultProps} />);

    // Fill basic info
    await user.type(screen.getByLabelText(/Policy Name/i), 'Test Policy');
    await user.type(screen.getByLabelText(/Description/i), 'Test description');

    // Select resource
    const resourceSelect = screen.getByLabelText(/Resource/i);
    await user.click(resourceSelect);
    await user.click(screen.getByText('organization:*'));

    // Select action
    const actionSelect = screen.getByLabelText(/Action/i);
    await user.click(actionSelect);
    await user.click(screen.getByText('read'));

    // Submit form
    await user.click(screen.getByText('Save Policy'));

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Policy',
          description: 'Test description',
          resource: 'organization:*',
          action: 'read',
          effect: 'allow',
          priority: 50,
          status: 'active',
        }),
      );
    });
  });

  it('toggles between allow and deny effect', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyBuilder {...defaultProps} />);

    // Initially should be 'allow'
    expect(screen.getByText('Allow access when conditions are met')).toBeInTheDocument();

    // Toggle to deny
    const effectSwitch = screen.getByRole('switch', { name: /Policy Effect/i });
    await user.click(effectSwitch);

    expect(screen.getByText('Deny access when conditions are met')).toBeInTheDocument();
  });

  it('adds and removes conditions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyBuilder {...defaultProps} />);

    // Initially no conditions
    expect(screen.getByText(/No conditions added/i)).toBeInTheDocument();

    // Add condition
    await user.click(screen.getByText('Add Condition'));

    // Condition editor should appear
    expect(screen.getByText('Condition 1')).toBeInTheDocument();
    expect(screen.getByText('Select attribute')).toBeInTheDocument();

    // Remove condition
    const removeButton = screen.getByRole('button', { name: /trash/i });
    await user.click(removeButton);

    // Should be back to no conditions
    expect(screen.getByText(/No conditions added/i)).toBeInTheDocument();
  });

  it('configures condition with attribute and value', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyBuilder {...defaultProps} />);

    // Add condition
    await user.click(screen.getByText('Add Condition'));

    // Select attribute
    const attributeSelect = screen.getByText('Select attribute');
    await user.click(attributeSelect);
    await user.click(screen.getByText('User Role'));

    // Select operator (should default to equals)
    expect(screen.getByText('Equals')).toBeInTheDocument();

    // Enter value
    const valueInput = screen.getByPlaceholderText('Enter value');
    await user.type(valueInput, 'admin');

    // Save policy
    await user.type(screen.getByLabelText(/Policy Name/i), 'Test Policy');
    const resourceSelect = screen.getByLabelText(/Resource/i);
    await user.click(resourceSelect);
    await user.click(screen.getByText('organization:*'));
    const actionSelect = screen.getByLabelText(/Action/i);
    await user.click(actionSelect);
    await user.click(screen.getByText('read'));

    await user.click(screen.getByText('Save Policy'));

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          conditions: {
            'subject.role': {
              equals: 'admin',
            },
          },
        }),
      );
    });
  });

  it('handles cancel action', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyBuilder {...defaultProps} />);

    await user.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('loads initial policy data for editing', () => {
    const existingPolicy = mockPolicy({
      name: 'Existing Policy',
      description: 'Existing description',
      resource: 'user:*',
      action: 'write',
      effect: 'deny',
      priority: 75,
    });

    renderWithProviders(<PolicyBuilder {...defaultProps} initialPolicy={existingPolicy} />);

    expect(screen.getByDisplayValue('Existing Policy')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('75')).toBeInTheDocument();
    expect(screen.getByText('Deny access when conditions are met')).toBeInTheDocument();
  });

  it('shows wildcard badges for resources and actions', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PolicyBuilder {...defaultProps} />);

    // Open resource dropdown
    const resourceSelect = screen.getByLabelText(/Resource/i);
    await user.click(resourceSelect);

    // Check for wildcard badges
    const wildcardBadges = screen.getAllByText('Wildcard');
    expect(wildcardBadges.length).toBeGreaterThan(0);

    // Close dropdown
    await user.keyboard('{Escape}');

    // Open action dropdown
    const actionSelect = screen.getByLabelText(/Action/i);
    await user.click(actionSelect);

    // Check for "All Actions" badge
    expect(screen.getByText('All Actions')).toBeInTheDocument();
  });
});
